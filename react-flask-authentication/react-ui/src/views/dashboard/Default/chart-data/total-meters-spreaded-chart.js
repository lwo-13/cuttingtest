//-----------------------|| DASHBOARD - TOTAL METERS SPREADED BAR CHART ||-----------------------//

const chartData = {
    height: 480,
    type: 'bar',
    options: {
        chart: {
            id: 'meters-bar-chart',
            stacked: false,
            toolbar: {
                show: true
            },
            zoom: {
                enabled: true
            }
        },
        responsive: [
            {
                breakpoint: 480,
                options: {
                    legend: {
                        position: 'bottom',
                        offsetX: -10,
                        offsetY: 0
                    }
                }
            }
        ],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '50%'
            }
        },
        xaxis: {
            type: 'category',
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },
        legend: {
            show: true,
            fontSize: '14px',
            fontFamily: `'Roboto', sans-serif`,
            position: 'bottom',
            offsetX: 20,
            labels: {
                useSeriesColors: false
            },
            markers: {
                width: 16,
                height: 16,
                radius: 5
            },
            itemMargin: {
                horizontal: 15,
                vertical: 8
            }
        },
        fill: {
            type: 'solid'
        },
        dataLabels: {
            enabled: false
        },
        grid: {
            show: true
        },
        yaxis: {
            title: {
                text: ''
            }
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " meters"
                }
            }
        }
    },
    series: [
        {
            name: 'Meters Spreaded',
            data: [350, 1250, 350, 350, 350, 800, 350, 200, 350, 450, 150, 750]
        }
    ]
};

export default chartData;
