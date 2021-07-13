// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display content of a text widget from other dashboard
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

const aws = require('aws-sdk');

const CSS = `<style>
    pre.error {
        background-color: #ffcbcb;
    }
</style>`;

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;   
    }

    const cloudwatch = new aws.CloudWatch();
    const dashboardName = event.dashboardName || '';
    if (dashboardName === '') {
        return `${CSS}<pre class='error'><b>dashboardName</b> parameter not set, please set by editing widget and entering <a target=_blank href="#dashboards:">dashboard name<a> to load text widget from</pre>`;
    }

    const dashboardResponse  = await cloudwatch.getDashboard({DashboardName: dashboardName}).promise();
    const widgets = JSON.parse(dashboardResponse.DashboardBody).widgets;
    for (const i in widgets) {
        const widget = widgets[i];
        if (widget['type'] === 'text') {
            return { markdown: widget.properties.markdown };
        }
    };
    
    return `${CSS}<pre class='error'>No text widget found in dashboard <b>${dashboardName}</b><br>Content:<br>${JSON.stringify(widgets, null, 4)}</pre>`;
};
