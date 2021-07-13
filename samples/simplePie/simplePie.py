# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: draw a simple SVG pie chart
import math

DOCS = """
## Simple Pie, using SVG
This pie chart is a simple example of how SVG can be used to display graphical content in a custom widget.

### Widget parameters
Param | Description
---|---
**slices** | Array containing slice data. Each entry must contain **value** (numerical value for size of slice) and **label** (the slice's label)
**legendHeight** | The height of the legend in pixels (optional, defaults to 25)

### Example parameters
``` yaml
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
```"""

PALETTE = [ '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5' ]
SVG_RADIUS = 200

def css(margin):
    return f"""<style>
        .label {{
            white-space: nowrap;
            display: inline-block;
        }}
        svg {{
            height: calc(100% - {margin}px);
            width: calc(100% - {margin}px);
            position: relative;
            left: {margin}px;
        }}
        .color {{
            display: inline-block;
            width: 16px;
            height: 16px;
            border-radius: 4px;
            margin: 0 5px 0 5px;
        }}
        span {{
            font-size: 18px;
            white-space: nowrap;
        }}
        </style>"""

def getCoordinatesForAngle(angle):
    x = int(round(SVG_RADIUS + (SVG_RADIUS - 5) * math.cos(math.pi * angle / 180)))
    y = int(round(SVG_RADIUS + (SVG_RADIUS - 5) * math.sin(math.pi * angle / 180)))
    return [x, y]


def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    slices = event['slices']
    legendHeight = event['legendHeight'] if 'legendHeight' in event else 25
    styles = css(legendHeight)
    startAngle = -90
    endAngle = -90
    total = 0
    paths = []
    labels = []

    for slice in slices:
        total += slice['value']
    
    for i, slice in enumerate(slices):
        value = slice['value']
        label = slice['label']
        color = slice['color'] if 'color' in slice else PALETTE[i % len(PALETTE)]
        angle = 360 * value / total
        startAngle = endAngle;
        endAngle = startAngle + angle;

        [x1, y1] = getCoordinatesForAngle(startAngle)
        [x2, y2] = getCoordinatesForAngle(endAngle)

        # create an array and join it just for code readability
        pathData = f"M200,200  L{x1},{y1}  A195,195 0 {1 if (endAngle-startAngle > 180) else 0},1 {x2},{y2} z"

        # create a <path> and append it to the <svg> element
        paths.append(f"""<path d="{pathData}" fill="{color}"></path>""")
        labels.append(f"""<div class="label"><span class="color" style="background-color: {color};"></span><span class="label">{label}</span></div>""")

    return f"""{styles}
        <svg viewBox="0 0 {SVG_RADIUS * 2} {SVG_RADIUS * 2}">
            {' '.join(paths)}
        </svg>
        <div>{' '.join(labels)}</div>"""
