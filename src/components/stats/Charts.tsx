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
  num_images?: number;
  num_posts_with_images?: number;
  num_images_with_alt_text?: number;
  alt_text_ratio?: number;
}


export interface ChartProps {
  data: DailyDatapoint[];
  columnFilter?: string[];
  title: string;
  startOffset?: number;
}

const labelMap = {
  num_likers: "Unique Likers",
  num_followers: "Unique Followers",
  num_posters: "Unique Posters",
  num_likes: "Total Likes",
  num_follows: "Total Follows",
  num_posts: "Total Posts",
  num_posts_with_images: "Posts with Images",
  num_images_with_alt_text: "Images with Alt Text",
  alt_text_ratio: "Percentage of Images with Alt Text",
};

type labelKey = keyof typeof labelMap;

const colorMap = {
  num_likers: "skyblue",
  num_followers: "lightgreen",
  num_posters: "lightcoral",
  num_likes: "skyblue",
  num_follows: "lightgreen",
  num_posts: "lightcoral",
  num_posts_with_images: "skyblue",
  num_images_with_alt_text: "lightgreen",
  alt_text_ratio: "lightcoral",
};

export const DailyBarChart = ({ data, columnFilter, title, startOffset }: ChartProps) => {
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
      data: data.map((d) => d[key as labelKey]),
    })),
    dataZoom: [
      {
        type: "slider",
        show: true,
        xAxisIndex: [0, 1],
        start: startOffset,
        end: 100,
        showDataShadow: true,
      },
      {
        type: "inside",
        xAxisIndex: [0, 1],
        start: startOffset,
        end: 100,
      },
    ],
  };


  return <ReactECharts option={options} style={{ height: "465px" }} />;
};
