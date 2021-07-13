// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display a CloudWatch metric graph as bitmap
const aws = require('aws-sdk');

const DOCS = `
## Display a CloudWatch bitmap graph
Displays CloudWatch metrics as a bitmap, for faster display of metrics.

### Widget parameters
Param | Description
---|---
**graph** | The graph definition. Use the parameters from the **Source** tab in CloudWatch Console's **Metrics** page

### Example parameters
\`\`\` yaml
graph:
  view: timeSeries
  metrics:
  - [ AWS/Lambda, Invocations ]
  region: ${process.env.AWS_REGION}
\`\`\`
`;

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;   
    }

    const widgetContext = event.widgetContext;
    const timeRange = widgetContext.timeRange.zoom || widgetContext.timeRange;
    const start = new Date(timeRange.start).toISOString();
    const end = new Date(timeRange.end).toISOString();
    const width = widgetContext.width;
    const height = widgetContext.height;
    const graph = Object.assign(event.graph, { start, end, width, height});
    if (!graph.theme) {
        graph.theme = widgetContext.theme;
    }
    const params = { 
        MetricWidget: JSON.stringify(graph) 
    }; 
    const region = event.graph.region;
    const cloudwatch = new aws.CloudWatch({ region });
    const image = await cloudwatch.getMetricWidgetImage(params).promise(); 
    const base64Image = Buffer.from(image.MetricWidgetImage).toString('base64');  

    return `<img src="data:image/png;base64,${base64Image}">`;
};
