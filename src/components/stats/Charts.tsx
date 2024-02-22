import ReactECharts from 'echarts-for-react';

export interface DailyDatapoint {
  date: string;
  num_likes?: number;
  num_follows?: number;
  num_posts?: number;
  num_blocks?: number;
  num_likers?: number;
  num_followers?: number;
  num_posters?: number;
  num_blockers?: number;
}


export interface ChartProps {
  data: DailyDatapoint[];
  columnFilter?: string[];
  title: string;
}

const labelMap = {
  num_likers: "Unique Likers",
  num_followers: "Unique Followers",
  num_posters: "Unique Posters",
};

type labelKey = keyof typeof labelMap;

const colorMap = {
  num_likers: "skyblue",
  num_followers: "lightgreen",
  num_posters: "lightcoral",
};

export const DailyBarChart = ({ data, columnFilter, title }: ChartProps) => {
  if (columnFilter) {
    data = data.map((d) => {
      const newD: DailyDatapoint = { date: d.date };
      columnFilter.forEach((key) => {
        newD[key as labelKey] = d[key as labelKey];
      });
      return newD;
    });
  }

  const keys = columnFilter || Object.keys(labelMap);

  const options = {
    height: 350,
    title: {
      text: title,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      data: keys.map((key) => labelMap[key as labelKey]),
    },
    grid: {
      left: "3%",
      right: "4%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.date),
    },
    yAxis: {
      type: "value",
    },
    series: keys.map((key) => ({
      name: labelMap[key as labelKey],
      type: "bar",
      color: colorMap[key as labelKey],
      stack: "total",
      data: data.map((d) => d[key as labelKey]),
    })),
    dataZoom: [
      {
        type: "slider",
        show: true,
        xAxisIndex: [0, 1],
        start: 70,
        end: 100,
        showDataShadow: true,
      },
      {
        type: "inside",
        xAxisIndex: [0, 1],
        start: 70,
        end: 100,
      },
    ],
  };


  return <ReactECharts option={options} style={{ height: "465px" }} />;
};
