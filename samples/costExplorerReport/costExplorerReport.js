// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: display sample Cost Explorer report
const aws = require('aws-sdk');

const DOCS = `## Display Cost Explorer report
Displays a report on cost of each AWS service for the selected time range.`;

const PALETTE = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf','#aec7e8','#ffbb78','#98df8a','#ff9896','#c5b0d5','#c49c94','#f7b6d2','#c7c7c7','#dbdb8d','#9edae5' ];
const CSS = `<style>table{width:100%}td,th{font-family:Amazon Ember,Helvetica Neue,Roboto,Arial,sans-serif;font-size:14px;white-space:nowrap;text-align:center;padding:3px;border-bottom:1px solid #f2f2f2}td:first-child{text-align:right;width:1px}td:nth-child(2){width:1px;font-weight:700}td div{border-radius:6px;height:18px}tr:hover{background:#fbf8e9!important;transition:all .1s ease-in-out}th{text-align:center;border-bottom:1px solid #ccc;background-color:#fafafa;height:40px}.cwdb-theme-dark td,.cwdb-theme-dark th{color:white;background-color:#2A2E33;}</style>`;

const getCostResults = async (start, end) => {
    const ce = new aws.CostExplorer({ region: 'us-east-1' });
    let NextPageToken = null;
    let costs = [];
    do {    // paginate until no next page token
        const params = { TimePeriod: { Start: start, End: end }, Granularity: 'DAILY', GroupBy: [  { Type: 'DIMENSION', Key: 'SERVICE' } ], Metrics: [ 'UnblendedCost' ], NextPageToken };
        const response = await ce.getCostAndUsage(params).promise();
        costs = costs.concat(response.ResultsByTime);
        NextPageToken = response.NextPageToken;
    } while (NextPageToken);
    return costs;
};

const tableStart = (totalCost, start, end) => {
    return `<table class="cwdb-no-default-styles"><thead><tr><th>Service</th><th colspan=2><a href="/cost-management/home?region=us-east-1#/dashboard" target=_blank>Total Cost: $${totalCost.toLocaleString(undefined, {maximumFractionDigits: 0 })} (${start} - ${end})</a></td></tr></thead>`;
};

const collate = costResults => {
    const scs = {};
    let totalCost = 0;
    costResults.forEach(result => {
        result.Groups.forEach(group => {
            const serviceName = group.Keys[0];
            let serviceCost = scs[serviceName] || 0;
            let currentDayCost = parseFloat(group.Metrics.UnblendedCost.Amount) || 0;
            totalCost += currentDayCost;
            serviceCost += parseFloat(group.Metrics.UnblendedCost.Amount);
            scs[serviceName] = serviceCost;
        });
    });
    const sortedScs = Object.entries(scs).sort(([,a],[,b]) => b-a);
    const maxServiceCost = Math.max(...sortedScs.map(cost => cost[1]));
    return { totalCost, serviceCosts: sortedScs, maxServiceCost };
};

const getCostResultsHtml = (costResults, start, end) => {
    costResults.sort((a, b) => a.TimePeriod.Start.localeCompare(b.TimePeriod.Start));
    const  { totalCost, serviceCosts, maxServiceCost } = collate(costResults);
    let html = tableStart(totalCost, start, end);

    serviceCosts.forEach((serviceEntry, i) => {
        const [ serviceName, serviceCost ] = serviceEntry;
        const percent = (serviceCost / totalCost * 100).toFixed(2);
        const maxPercent = (serviceCost / maxServiceCost * 100).toFixed(2);
        const color = PALETTE[i % PALETTE.length];
        html += `<tr><td>${serviceName}</td><td title="${percent}%">$${serviceCost.toLocaleString(undefined, {maximumFractionDigits: 2 })}</td><td title="${percent}%"><div style="background-color: ${color}; width: ${maxPercent}%;"></div></td></tr>`;
    });
    return `${html}</table>`;
};

exports.handler = async (event) => {
    if (event.describe) {
        return DOCS;
    }
    const widgetContext = event.widgetContext;
    const timeRange = widgetContext.timeRange.zoom || widgetContext.timeRange;
    const start = timeRange.start;
    const end = timeRange.end;
    const minTimeDiff = Math.max(end - start, 24 * 60 * 60 * 1000);
    const newStart = end - minTimeDiff;
    const startStr = new Date(newStart).toISOString().split('T')[0];
    const endStr = new Date(end).toISOString().split('T')[0];
    const dailyCosts = await getCostResults(startStr, endStr);
    return CSS + getCostResultsHtml(dailyCosts, startStr, endStr);
};