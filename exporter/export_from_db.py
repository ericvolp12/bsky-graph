import asyncio
import os
from functools import wraps

import aiohttp
import click
import dotenv
import psycopg2
import psycopg2.extras
from tqdm import tqdm

dotenv.load_dotenv()

QUERY = """
WITH author_relationships AS (
    SELECT p1.actor_did AS source,
           p2.actor_did AS target,
           p2.inserted_at
    FROM posts p1
    INNER JOIN posts p2 ON (
        ( p1.rkey = p2.parent_post_rkey
          AND p1.actor_did = p2.parent_post_actor_did
        ) OR (p1.rkey = p2.quote_post_rkey
          AND p1.actor_did = p2.quote_post_actor_did)
        )
    AND p1.actor_did <> p2.actor_did  -- This condition removes self-edges
),
relationship_weights AS (
    SELECT source,
           target,
           EXP(
               -0.01 * EXTRACT(
                   EPOCH
                   FROM AGE(NOW(), inserted_at)
               ) / 86400
           ) AS weight
    FROM author_relationships
)
SELECT source,
       target,
       SUM(weight) AS weight
FROM relationship_weights
GROUP BY source, target
HAVING SUM(weight) > 2.0;
"""


def coro(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        return asyncio.run(f(*args, **kwargs))

    return wrapper


did_cache = {}


@click.command()
@coro
@click.option("--db-name", default=os.getenv("DB_NAME"), help="Database name")
@click.option("--db-user", default=os.getenv("DB_USER"), help="Database user")
@click.option(
    "--db-pass", default=os.getenv("DB_PASS"), help="Database password", hide_input=True
)
@click.option("--db-host", default=os.getenv("DB_HOST"), help="Database host")
@click.option("--db-port", default=os.getenv("DB_PORT"), help="Database port")
@click.option("--output", default=os.getenv("OUTPUT"), help="Output file")
@click.option(
    "--plc-mirror-host", default=os.getenv("PLC_MIRROR_HOST"), help="PLC Mirror host"
)
async def export_query_to_tsv(
    db_name, db_user, db_pass, db_host, db_port, output, plc_mirror_host
):
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(
            database=db_name, user=db_user, password=db_pass, host=db_host, port=db_port
        )
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        print("Executing query...")
        cur.execute(QUERY)
        results = cur.fetchall()

        # Create an asynchttp client session to lookup the actor_did
        async with aiohttp.ClientSession() as session:
            print("Writing to file...")
            with open(output, "w") as f:
                for row in tqdm(results, total=len(results)):
                    # Lookup the actor_did
                    source = None
                    target = None
                    if row["source"] not in did_cache:
                        async with session.get(
                            f"{plc_mirror_host}/{row['source']}"
                        ) as resp:
                            source_resp = await resp.json()
                            if "handle" not in source_resp:
                                print(f"Error: {source_resp}")
                                did_cache[row["source"]] = "error"
                                continue
                            source = source_resp["handle"]
                            did_cache[row["source"]] = source
                    else:
                        source = did_cache[row["source"]]
                        if source == "error":
                            continue
                    if row["target"] not in did_cache:
                        async with session.get(
                            f"{plc_mirror_host}/{row['target']}"
                        ) as resp:
                            target_resp = await resp.json()
                            if "handle" not in target_resp:
                                print(f"Error: {target_resp}")
                                did_cache[row["target"]] = "error"
                                continue
                            target = target_resp["handle"]
                            did_cache[row["target"]] = target
                    else:
                        target = did_cache[row["target"]]
                        if target == "error":
                            continue
                    f.write(
                        f"{row['source']}\t{source}\t{row['target']}\t{target}\t{row['weight']}\n"
                    )

            print("Export complete.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    export_query_to_tsv()
