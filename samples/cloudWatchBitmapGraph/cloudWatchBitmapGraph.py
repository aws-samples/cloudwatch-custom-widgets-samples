# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: display a CloudWatch metric graph as bitmap
import base64 
import boto3
import datetime
import json
import os

DOCS = f"""
## Display a CloudWatch bitmap graph
Displays CloudWatch metrics as a bitmap, for faster display of metrics.

### Widget parameters
Param | Description
---|---
**graph** | The graph definition. Use the parameters from the **Source** tab in CloudWatch Console's **Metrics** page

### Example parameters
``` yaml
graph:
  view: timeSeries
  metrics:
  - [ AWS/Lambda, Invocations ]
  region: {os.environ.get("AWS_REGION")}
```"""

def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    widgetContext = event['widgetContext']
    timeRange = widgetContext['timeRange']['zoom'] if 'zoom' in widgetContext['timeRange'] else widgetContext['timeRange']
    start = datetime.datetime.utcfromtimestamp(timeRange['start']/1000).isoformat()
    end = datetime.datetime.utcfromtimestamp(timeRange['end']/1000).isoformat()
    width = widgetContext['width']
    height = widgetContext['height']
    graph = { **event['graph'], 'start': start, 'end': end, 'width': width, 'height': height }
    if 'theme' not in graph:
        graph['theme'] = widgetContext['theme']
    params = { 'MetricWidget': json.dumps(graph) }
    region = graph['region']

    cloudwatch = boto3.client('cloudwatch', region_name=region)
    image = cloudwatch.get_metric_widget_image(**params)
    base64_image = base64.b64encode(image['MetricWidgetImage']).decode('UTF-8')
    return f"""<img src="data:image/png;base64,{base64_image}">"""
