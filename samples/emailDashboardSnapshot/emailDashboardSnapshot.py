# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# CloudWatch Custom Widget sample: send bitmap snapshot of a CloudWatch Dashboard by email
import base64 
import boto3
import datetime
import json
import os
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

DOCS = """
## Send bitmap snapshot of a CloudWatch Dashboard by email
Grabs bitmap snapshots of all metric widgets in the current CloudWatch Dashboard and sends them to an email address configured in [SES](/ses/home).
```"""

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

def email_bitmaps(dashboardName, email, bitmaps, sesRegion):
    subject = f"Dashboard snapshot: {dashboardName}"
    html = f"<h3>{subject}</h3>"
    msg = MIMEMultipart()

    for index, bitmap in enumerate(bitmaps):
        mimeImg = MIMEImage(bitmap)
        mimeImg.add_header('Content-ID', f"<img-{index}>")
        html += f"<center><img src='cid:img-{index}'></center>"
        msg.attach(mimeImg)

    msg['Subject'] = subject
    msg['From'] = email
    msg['To'] = email
    msg.attach(MIMEText(html, 'html'))
    ses = boto3.client('ses', region_name=sesRegion)
    return ses.send_raw_email(Source=msg['From'], Destinations=[email], RawMessage={'Data': msg.as_string()})                                                    
    
def lambda_handler(event, context):
    if 'describe' in event:
        return DOCS 
    form = event['widgetContext']['forms']['all']
    email = form.get('email', '')
    widgetContext = event['widgetContext']
    dashboardName = widgetContext['dashboardName']
    timeRange = widgetContext['timeRange']['zoom'] if 'zoom' in widgetContext['timeRange'] else widgetContext['timeRange']
    start = datetime.datetime.utcfromtimestamp(timeRange['start']/1000).isoformat()
    end = datetime.datetime.utcfromtimestamp(timeRange['end']/1000).isoformat()
    width = event['width']
    height = event['height']
    unitWidth = widgetContext['width'] / width
    unitHeight = widgetContext['height'] / height
    sesRegion = event['sesRegion']
    msg = f"""<br>Only emails verified in <a href="/ses/home?region=us-east-1#verified-senders-email:" target=_blank>SES Console</a> can receive snapshot"""
    if email is not None and email != '':
        dashboard = load_dashboard(dashboardName)
        widgets = dashboard['widgets']
        bitmaps = get_metric_bitmaps(widgets, start, end, unitWidth, unitHeight)
        
        try:
            sesResult = email_bitmaps(dashboardName, email, bitmaps, sesRegion)
            msg = f"<pre>Snapshot was sent successfully to '{email}'</pre>"
        except Exception as e:
            msg = f"<pre>Snapshot failed to send to '{email}': {e}</pre>"

    return f"""
        <form><br><table><tr><td>Email</td><td><input name="email" value=""></td>
            <td><a class="btn btn-primary">Submit</a><cwdb-action action="call" endpoint="{context.invoked_function_arn}">
                {{ "sesRegion": "{sesRegion}", "width": {width}, "height": {height} }}</cwdb-action></td></tr></table>
        </form>{msg}"""
