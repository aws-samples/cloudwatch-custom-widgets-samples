// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display content of a text widget from other dashboard
const { CloudWatchClient, GetDashboardCommand } = require("@aws-sdk/client-cloudwatch");

const DOCS = `
## Include Text Widget from CloudWatch Dashboard
This widget displays the first text widget from a specified CloudWatch Dashboard. 

This is useful for embedding the same text context in multiple dashboards and update it from a central place. An example would be a menu of links between dashboards.

### Widget parameters
Param | Description
---|---
**dashboardName** | The name of the dashboard from which to load the text widget. The first text widget on that dashboard is loaded.

### Example parameters
\`\`\` yaml
dashboardName: sharedMenu
\`\`\`
`;

const CSS = `<style>
    pre.error {
        background-color: #ffcbcb;
    }
</style>`;

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;
    }

    const region = event.region || process.env.AWS_REGION;
    const cloudwatch = new CloudWatchClient({ region });
    const dashboardName = event.dashboardName || '';
    if (dashboardName === '') {
        return `${CSS}<pre class='error'><b>dashboardName</b> parameter not set, please set by editing widget and entering <a target=_blank href="#dashboards:">dashboard name<a> to load text widget from</pre>`;
    }

    try {
        const command = new GetDashboardCommand({ DashboardName: dashboardName });
        const dashboardResponse = await cloudwatch.send(command);
        const widgets = JSON.parse(dashboardResponse.DashboardBody).widgets;
        for (const widget of widgets) {
            if (widget['type'] === 'text') {
                return { markdown: widget.properties.markdown };
            }
        }

        return `${CSS}<pre class='error'>No text widget found in dashboard <b>${dashboardName}</b><br>Content:<br>${JSON.stringify(widgets, null, 4)}</pre>`;
    } catch (error) {
        console.error("Error fetching dashboard:", error);
        return `${CSS}<pre class='error'>Error fetching dashboard: ${error.message}</pre>`;
    }
};
