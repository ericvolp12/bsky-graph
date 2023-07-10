import os
import click
import psycopg2
import psycopg2.extras
from tqdm import tqdm

QUERY = """
WITH author_relationships AS (
    SELECT p1.author_did AS source,
        a1.handle AS sourceHandle,
        p2.author_did AS target,
        a2.handle AS targetHandle,
        p2.created_at
    FROM posts p1
        INNER JOIN posts p2 ON p1.id = p2.parent_post_id
        AND p1.author_did <> p2.author_did
        INNER JOIN authors a1 ON p1.author_did = a1.did
        INNER JOIN authors a2 ON p2.author_did = a2.did
    WHERE p2.parent_relationship IN ('r', 'q')
),
relationship_weights AS (
    SELECT source,
        sourceHandle,
        target,
        targetHandle,
        EXP(
            -0.01 * EXTRACT(
                EPOCH
                FROM AGE(NOW(), created_at)
            ) / 86400
        ) AS weight
    FROM author_relationships
)
SELECT source,
    sourceHandle,
    target,
    targetHandle,
    SUM(weight) AS weight
FROM relationship_weights
GROUP BY source,
    sourceHandle,
    target,
    targetHandle;
"""


@click.command()
@click.option("--db-name", prompt=True, help="Database name")
@click.option("--db-user", prompt=True, help="Database user")
@click.option("--db-pass", prompt=True, help="Database password", hide_input=True)
@click.option("--db-host", prompt=True, help="Database host")
@click.option("--db-port", default=5432, help="Database port")
@click.option("--output", prompt=True, help="Output file")
def export_query_to_tsv(db_name, db_user, db_pass, db_host, db_port, output):
    try:
        conn = psycopg2.connect(
            database=db_name, user=db_user, password=db_pass, host=db_host, port=db_port
        )
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        print("Executing query...")
        cur.execute(QUERY)
        results = cur.fetchall()

        print("Writing to file...")
        with open(output, "w") as f:
            for row in tqdm(results, total=len(results)):
                f.write("\t".join(str(i) for i in row))
                f.write("\n")

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
