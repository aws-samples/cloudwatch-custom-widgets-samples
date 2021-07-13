# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: display content of a text widget from other dashboard
import base64 
import boto3
import datetime
import json

DOCS = """
## Include Text Widget from CloudWatch Dashboard
This widget displays the first text widget from a specified CloudWatch Dashboard. 

This is useful for embedding the same text context in multiple dashboards and update it from a central place. An example would be a menu of links between dashboards.

### Widget parameters
Param | Description
---|---
**dashboardName** | The name of the dashboard from which to load the text widget. The first text widget on that dashboard is loaded.

### Example parameters
``` yaml
dashboardName: sharedMenu
```"""

CSS = """<style>
    pre.error {
        background-color: #ffcbcb;
    }
</style>"""

def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    cloudwatch = boto3.client('cloudwatch')
    dashboardName = event['dashboardName'] if 'dashboardName' in event else ''

    if dashboardName == '':
        return f"""{CSS}<pre class='error'><b>dashboardName</b> parameter not set, please set by editing widget and entering <a target=_blank href="#dashboards:">dashboard name<a> to load text widget from</pre>"""

    dashboard  = cloudwatch.get_dashboard(DashboardName=dashboardName)
    dashboardBody = json.loads(dashboard['DashboardBody'])
    widgets = dashboardBody['widgets']
    for widget in widgets:
        if widget['type'] == 'text':
            return { 'markdown': widget['properties']['markdown'] }

    return f"{CSS}<pre class='error'>No text widget found in dashboard <b>{dashboardName}</b><br>Content:<br>{dashboardBody}</pre>";
