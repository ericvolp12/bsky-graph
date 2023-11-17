import cudf
import cugraph

# read data into a cuDF DataFrame using read_csv
gdf = cudf.read_csv("graph_data.csv", names=["src", "dst"], dtype=["int32", "int32"])

# We now have data as edge pairs
# create a Graph using the source (src) and destination (dst) vertex pairs
G = cugraph.Graph()
G.from_cudf_edgelist(gdf, source='src', destination='dst')

# Let's now get the PageRank score of each vertex by calling cugraph.pagerank
df_page = cugraph.pagerank(G)

# Let's look at the top 10 PageRank Score
df_page.sort_values('pagerank', ascending=False).head(10)
