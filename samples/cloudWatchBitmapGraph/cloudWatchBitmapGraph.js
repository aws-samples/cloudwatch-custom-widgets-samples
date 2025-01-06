// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display a CloudWatch metric graph as bitmap
const { CloudWatchClient, GetMetricWidgetImageCommand } = require("@aws-sdk/client-cloudwatch");

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

    const cloudwatch = new CloudWatchClient({ region });
    const command = new GetMetricWidgetImageCommand(params);

    try {
        const response = await cloudwatch.send(command);
        const base64Image = Buffer.from(response.MetricWidgetImage).toString('base64');
        return `<img src="data:image/png;base64,${base64Image}">`;
    } catch (error) {
        console.error("Error fetching metric widget image:", error);
        return `<p>Error fetching metric widget image: ${error.message}</p>`;
    }
};
