import { Settings } from "sigma/settings";
import { NodeDisplayData, PartialButFor } from "sigma/types";

const maxLineLength = 20;
const PADDING = 3;

export function drawLabel(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color">,
  settings: Settings
): void {
  if (!data.label) return;

  const size = data.labelSize || settings.labelSize;
  const font = settings.labelFont;
  const weight = settings.labelWeight;
  const color = data.labelColor || settings.labelColor.color;

  context.fillStyle = color;
  context.font = `${weight} ${size}px ${font}`;

  const words = data.label.split(" ");
  let line = "";
  let lineNumber = 0;

  words.forEach((word, index) => {
    const newLine = line + (line.length > 0 ? " " : "") + word;

    if (newLine.length > maxLineLength) {
      context.fillText(
        line,
        data.x + data.size + 9,
        data.y + size / 3 + lineNumber * size
      );
      lineNumber++;
      line = word;
    } else {
      line = newLine;
    }

    if (index === words.length - 1) {
      context.fillText(
        line,
        data.x + data.size + 9,
        data.y + size / 3 + lineNumber * size
      );
    }
  });
}

/**
 * Draw an hovered node.
 * - if there is no label => display a shadow on the node
 * - if the label box is bigger than node size => display a label box that contains the node with a shadow
 * - else node with shadow and the label box
 */
export function drawHover(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color">,
  settings: Settings
): void {
  const size = settings.labelSize,
    font = settings.labelFont,
    weight = settings.labelWeight;

  context.font = `${weight} ${size}px ${font}`;

  // Then we draw the label background
  context.fillStyle = "#FFF";
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 8;
  context.shadowColor = "#000";

  if (typeof data.label === "string") {
    const words = data.label.split(" ");
    let line = "";
    let lineNumber = 0;
    let lineWidths: number[] = [];

    words.forEach((word, index) => {
      const newLine = line + (line.length > 0 ? " " : "") + word;

      if (newLine.length > maxLineLength) {
        lineWidths.push(context.measureText(line).width);
        lineNumber++;
        line = word;
      } else {
        line = newLine;
      }

      if (index === words.length - 1) {
        lineWidths.push(context.measureText(line).width);
      }
    });

    const textWidth = Math.max(...lineWidths),
      boxWidth = Math.round(textWidth + 10),
      boxHeight = Math.round(size * (lineNumber + 1) + 2 * PADDING),
      radius = Math.max(data.size, size / 2) + PADDING;

    const angleRadian = Math.asin(boxHeight / 2 / radius);
    const xDeltaCoord = Math.sqrt(Math.abs(Math.pow(radius, 2)));

    context.beginPath();
    context.moveTo(data.x + xDeltaCoord, data.y - size - PADDING);
    context.lineTo(data.x + xDeltaCoord + boxWidth, data.y - size - PADDING);
    context.lineTo(data.x + xDeltaCoord + boxWidth, data.y + boxHeight);
    context.lineTo(data.x + xDeltaCoord, data.y + boxHeight);
    context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
    context.closePath();
    context.fill();
  } else {
    context.beginPath();
    context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }

  context.beginPath();
  context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
  context.closePath();
  context.fill();

  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;

  // And finally we draw the label
  drawLabel(context, data, settings);
}
