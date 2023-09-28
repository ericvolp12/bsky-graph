import { ResponsiveBar } from "@nivo/bar";

export interface DailyDatapoint {
  date: string;
  num_likes: number;
  num_follows: number;
  num_posts: number;
  num_blocks: number;
  num_likers: number;
  num_followers: number;
  num_posters: number;
  num_blockers: number;
}

export interface Col {
  key: string;
  label: string;
  color: string;
  hidden: boolean;
}

export interface ChartProps {
  data: DailyDatapoint[];
  cols: Col[];
}

const labelMap = {
  num_likers: "Unique Likers",
  num_followers: "Unique Followers",
  num_posters: "Unique Posters",
};

type labelKey = keyof typeof labelMap;

export const DataVolumeBarChart = ({ data, cols }: ChartProps) => (
  <ResponsiveBar
    data={data}
    keys={cols.map((c) => c.key)}
    indexBy="date"
    layout="vertical"
    margin={{ top: 50, right: 50, bottom: 75, left: 50 }}
    padding={0.15}
    valueScale={{ type: "linear" }}
    indexScale={{ type: "band", round: true }}
    colors={(d) => cols.find((c) => c.key === d.id)?.color ?? "#000000"}
    borderColor={{
      from: "color",
      modifiers: [["darker", 1.6]],
    }}
    axisTop={null}
    axisRight={null}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: -40,
      legend: "Date",
      legendPosition: "middle",
      legendOffset: 60,
    }}
    axisLeft={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: -25,
      legend: "Unique Users",
      legendPosition: "middle",
      legendOffset: -45,
      format: (v) => {
        if (v > 1000) {
          return `${v / 1000000}m`;
        }
        return v.toLocaleString();
      },
    }}
    labelFormat={(v) => v.toLocaleString()}
    labelSkipWidth={12}
    labelSkipHeight={12}
    labelTextColor={{
      from: "color",
      modifiers: [["darker", 1.6]],
    }}
    tooltipLabel={(v) => {
      const key = v.id as labelKey;
      if (key in labelMap) {
        return labelMap[key];
      }
      return v.id.toLocaleString();
    }}
    // Value Format to {thousands}k or {millions}m
    valueFormat={(v) => {
      if (v > 1000 && v < 1000000) {
        return `${Math.round(v / 1000)}k`;
      } else if (v > 1000000) {
        return `${(v / 1000000).toFixed(2)}m`;
      }
      return v.toLocaleString();
    }}
    theme={{
      axis: {
        ticks: {
          text: {
            fontSize: 10,
          },
        },
      },
      labels: {
        text: {
          fontSize: 10,
        },
      },
    }}
    role="application"
  />
);
