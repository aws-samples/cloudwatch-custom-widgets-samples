// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: draw a simple SVG pie chart
const DOCS = `
## Simple Pie, using SVG
This pie chart is a simple example of how SVG can be used to display graphical content in a custom widget.

### Widget parameters
Param | Description
---|---
**slices** | Array containing slice data. Each entry must contain **value** (numerical value for size of slice) and **label** (the slice's label)
**legendHeight** | The height of the legend in pixels (optional, defaults to 25)

### Example parameters
\`\`\` yaml
---
legendHeight: 75
slices:
- value: 16
  label: Give you up
- value: 16
  label: Let you down
- value: 16
  label: Run around and desert you
- value: 16
  label: Make you cry
- value: 16
  label: Say goodbye
- value: 16
  label: Tell a lie and hurt you
- value: 5
  label: Give, never gonna give
\`\`\`
`;

const PALETTE = [ '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5' ];
const SVG_RADIUS = 200;
const css = margin => {
    return `<style>
        .label {
            white-space: nowrap;
            display: inline-block;
        }
        svg {
            height: calc(100% - ${margin}px);
            width: calc(100% - ${margin}px);
            position: relative;
            left: ${margin}px;
        }
        .color {
            display: inline-block;
            width: 16px;
            height: 16px;
            border-radius: 4px;
            margin: 0 5px 0 5px;
        }
        span {
            font-size: 18px;
            white-space: nowrap;
        }
        </style>`;
}

const getCoordinatesForAngle = (angle) => {
    const x = parseInt(Math.round(SVG_RADIUS + (SVG_RADIUS - 5) * Math.cos(Math.PI * angle / 180)));
    const y = parseInt(Math.round(SVG_RADIUS + (SVG_RADIUS - 5) * Math.sin(Math.PI * angle / 180)));
    return [x, y];
};

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;   
    }

    const slices = event.slices;
    const total = slices.reduce((total, slice) => total + slice.value, 0);
    let startAngle, endAngle = -90;

    const slicesHtml = slices.map((slice, i) => {
        const angle = 360 * slice.value / total;
        startAngle = endAngle;
        endAngle = startAngle + angle;
        const [x1, y1] = getCoordinatesForAngle(startAngle);
        const [x2, y2] = getCoordinatesForAngle(endAngle);

        var d = `M200,200  L${x1},${y1}  A195,195 0 ${((endAngle-startAngle > 180) ? 1 : 0)},1 ${x2},${y2} z`;
        const color = slice.color || PALETTE[i % PALETTE.length];

        // create a <path> and append it to the <svg> element
        return {path: `<path d="${d}" fill="${color}"></path>`,
                label:`<div class="label"><span class="color" style="background-color: ${color};"></span><span class="label">${slice.label}</span></div>` }; 
    });

    return `${css(event.legendHeight || 25)}
        <svg viewBox="0 0 ${SVG_RADIUS * 2} ${SVG_RADIUS * 2}">
            ${slicesHtml.map(slice => slice.path).join('')}
        </svg>
        <div>${slicesHtml.map(slice => slice.label).join(' ')}</div>`; 
}