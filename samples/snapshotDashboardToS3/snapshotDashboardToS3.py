# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: snapshot CloudWatch metric graphs in dashboard to S3
import base64 
import boto3
import datetime
import json
import os
import secrets

DOCS = """## Store bitmap snapshot of a CloudWatch Dashboard in S3
Stores bitmap snapshots of all metric widgets in the current CloudWatch Dashboard and in a HTML file in S3."""
CSS = "<style>pre.success { background-color: #e6fde6;} pre.error { background-color: #ffcbcb; }</style>"

def load_dashboard(dashboardName):
    cloudwatch = boto3.client('cloudwatch')
    dashboard = cloudwatch.get_dashboard(DashboardName=dashboardName)
    return json.loads(dashboard['DashboardBody'])

def get_metric_bitmaps(widgets, start, end, unitWidth, unitHeight):
    bitmaps = []
    for widget in widgets:
        if widget['type'] != 'metric':
            continue

        width = widget['width'] if 'width' in widget else 12
        height = widget['height'] if 'height' in widget else 12
        widgetProps = widget['properties']
        graph = { **widgetProps, 'start': start, 'end': end, 'width': int(width * unitWidth), 'height': int(height * unitHeight) }
        params = { 'MetricWidget': json.dumps(graph) }
        region = widgetProps['region']
        cloudwatch = boto3.client('cloudwatch', region_name=region)
        image = cloudwatch.get_metric_widget_image(**params)
        bitmaps.append(image['MetricWidgetImage'])
    
    return bitmaps

def get_snapshot_html(dashboardName, bitmaps):
    subject = f"Dashboard snapshot: {dashboardName}"
    html = f"<h3>{subject}</h3>"

    for bitmap in bitmaps:
        base64_bitmap = base64.b64encode(bitmap).decode('UTF-8')
        html +=  f"""<div><img src="data:image/png;base64,{base64_bitmap}"></div>"""
    return html

def upload_snapshot(s3Bucket, s3Region, path, html):
    s3 = boto3.client('s3', region_name=s3Region)
    return s3.put_object(Body=html, Bucket=s3Bucket, Key=path, ContentType='text/html')

def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 

    s3Bucket = event['s3Bucket']
    s3Region = event['s3Region']
    widgetContext = event['widgetContext']
    dashboardName = widgetContext['dashboardName']
    timeRange = widgetContext['timeRange']['zoom'] if 'zoom' in widgetContext['timeRange'] else widgetContext['timeRange']
    start = datetime.datetime.utcfromtimestamp(timeRange['start']/1000).isoformat()
    end = datetime.datetime.utcfromtimestamp(timeRange['end']/1000).isoformat()
    width = event['width']
    height = event['height']
    unitWidth = widgetContext['width'] / width
    unitHeight = widgetContext['height'] / height
    doIt = event['doIt'] if 'doIt' in event else False
    msg = ""
    if doIt:
        if s3Bucket != "":
            dashboard = load_dashboard(dashboardName)
            widgets = dashboard['widgets']
            bitmaps = get_metric_bitmaps(widgets, start, end, unitWidth, unitHeight)
            s3ObjectPath = f"dashboardSnapshots/{dashboardName}_{secrets.token_urlsafe(8)}.html"
            s3Path = f"{s3Bucket}/{s3ObjectPath}"
            
            try:
                html = get_snapshot_html(dashboardName, bitmaps)
                s3Result = upload_snapshot(s3Bucket, s3Region, s3ObjectPath, html)
                msg = f"""<pre class='success'>Snapshot uploaded successfully to <a target=_blank href='/s3/object/{s3Path}?region={s3Region}'>{s3Path}</a></pre><p><h1>Snapshot</h1>{html}"""
            except Exception as e:
                msg = f"<pre class='error'>Snapshot failed to upload to '{s3Path}': {e}</pre>"
        else:
            msg = "<pre class='error'><b>s3Bucket</b> parameter not set, please set by editing widget and entering an S3 bucket that exists in this account</pre>"

    return f"""{CSS}<form><a class="btn btn-primary">Snapshot Dashboard to S3</a>
        <cwdb-action action="call" endpoint="{context.invoked_function_arn}" confirmation="Are you sure?">
            {{ "doIt": true, "s3Bucket": "{s3Bucket}", "s3Region": "{s3Region}", "width": {width}, "height": {height} }}</cwdb-action>
        </form>{msg}"""
