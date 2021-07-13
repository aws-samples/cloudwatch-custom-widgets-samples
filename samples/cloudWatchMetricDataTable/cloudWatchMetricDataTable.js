// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display CloudWatch metric data as a table
const aws = require('aws-sdk');

const DOCS = `
## Display CloudWatch metric data in a table
Retrieves data from CloudWatch metric API and displays the datapoint values in a table.

### Widget parameters
Param | Description
---|---
**MetricDataQueries** | An array of [MetricDataQuery](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_MetricDataQuery.html) definitions, same parameter that [GetMetricData API](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricData.html) expects
**region** | The region to call to get the data

### Example parameters
\`\`\` yaml
MetricDataQueries:
- Expression: SEARCH('{AWS/Lambda,FunctionName} MetricName="Invocations"', 'Sum',
    300)
  Id: lambda
  ReturnData: false
- Expression: SORT(lambda, SUM, DESC)
  Label: ''
  Id: sort
region: ${process.env.AWS_REGION}
\`\`\`
`;

const CSS = `<style>td,th{font-family:Arial,sans-serif;font-size:12px;white-space:nowrap;text-align:center;padding:3px;border-bottom:1px solid #f2f2f2}td:first-child{text-align:right}tr:hover{background:#fbf8e9!important;transition:all .1s ease-in-out}tbody tr:nth-child(even){background:#f5f5f5;box-shadow:0 1px 0 rgba(255,255,255,.8) inset}th{text-align:left;text-shadow:0 1px 0 rgba(255,255,255,.5);border-bottom:1px solid #ccc;background-color:#dce9f9;background-image:linear-gradient(top,#ebf3fc,#dce9f9)}th:first-child{border-radius:6px 0 0 0}th:last-child{border-radius:0 6px 0 0}th:only-child{border-radius:6px 6px 0 0}</style>`;

const orderData = data => {
    const allTimestamps = {};
    const allTimestampsToValues = [];
    data.forEach(metricResult => {
        const timestampsToValues = {};
        metricResult.Timestamps.forEach((timestamp, i) => {
           allTimestamps[timestamp] = []
           timestampsToValues[timestamp] = metricResult.Values[i];
       });
       allTimestampsToValues.push(timestampsToValues);
    });

    return { allTimestamps: Object.keys(allTimestamps).sort(), allTimestampsToValues };
};

const tableStart = allTimestamps => {
    const timestamps = allTimestamps.map(timestamp => {
        const d = new Date(timestamp);
        const mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
        const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
        const h = d.getHours();
        const m = '0' + new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(d);
        return `${mo} ${da}<br>${h}:${m.slice(-2)}`;
    }).join('</th><th>');
    return `<table class="cwdb-no-default-styles"><thead><tr><th></th><th>${timestamps}</td></tr></thead>`;
};

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;   
    }

    const widgetContext = event.widgetContext;
    const timeRange = widgetContext.timeRange.zoom || widgetContext.timeRange;
    const start = new Date(timeRange.start);
    const end = new Date(timeRange.end);
    const params = { 
        MetricDataQueries: event.MetricDataQueries,
        StartTime: start, 
        EndTime: end
    }; 
    const region = event.region;

    const cloudwatch = new aws.CloudWatch({ region });
    const gmdResponse  = await cloudwatch.getMetricData(params).promise(); 
    const data = gmdResponse.MetricDataResults;
    const { allTimestamps, allTimestampsToValues } = orderData(data);

    const metricRows = data.map((metricResult, i) => {
        let html = `<tr><td><b>${metricResult.Label}</b></td>`;
        let orderedMetricData = allTimestampsToValues[i];
        const values = allTimestamps.map(timestamp => {
            const value = orderedMetricData[timestamp];
            return value === undefined ? '' : '' + value;
        });
        html += `<td>${values.join('</td><td>')}</td></tr>`;
        return html;
    });
    
    return CSS + tableStart(allTimestamps) + `<tbody>${metricRows.join('')}</tbody></table>`;    
};
