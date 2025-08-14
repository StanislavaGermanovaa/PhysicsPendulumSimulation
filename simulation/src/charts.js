const zeroLinePlugin = {
  id: 'zeroLinePlugin',
  afterDraw(chart) {
    const {ctx, chartArea: {left, right, top, bottom}, scales: {y}} = chart;
    const yZero = y.getPixelForValue(0);

    if (yZero < top || yZero > bottom) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.moveTo(left, yZero);
    ctx.lineTo(right, yZero);
    ctx.stroke();
    ctx.restore();
  }
};

function createOscillationChart(ctx, chartLabel, yTitle, yMin, yMax, yStep, yTickFormat = (value) => `${value} м`, tooltipLabel = (context) => `Value: ${context.parsed.y} м`) {
  const chartData = {
    datasets: [{
      label: chartLabel,
      data: [],
      borderColor: 'lightblue',
      borderWidth: 2,
      pointStyle: 'cross',
      pointRadius: 3,
      pointBackgroundColor: 'red',
      fill: false,
      tension: 0.3
    }]
  };

  return new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Време (s)'
          },
          ticks: {
            callback: function (value, index, ticks) {
              return this.getLabelForValue(value);
            }
          },
          grid: {
            color: '#dddddd'
          }
        },
        y: {
          min: yMin,
          max: yMax,
          title: {
            display: true,
            text: yTitle
          },
          ticks: {
            stepSize: yStep,
            callback: yTickFormat
          },
          grid: {
            color: '#dddddd'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            title: function (context) {
              return `Време: ${context[0].label} s`;
            },
            label: tooltipLabel
          }
        }
      }
    },
    plugins: [zeroLinePlugin]
  });
}

function createEnergyChart(ctx, yMax = undefined) {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Потенциална', 'Кинетична', 'Обща'],
      datasets: [{
        label: 'Енергии и период',
        data: [0, 0, 0, 0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: false,
      scales: {
        y: {
          beginAtZero: true,
          max: yMax,
          ticks: {
            stepSize: yMax ? 0.1 : undefined
          },
          title: {
            display: true,
            text: 'Стойност'
          }
        }
      },
      plugins: {
        legend: {
          display: false 
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              const value = context.parsed.y.toFixed(2);
              const units = [' J', ' J', ' J']; 
              return `${context.label}: ${value}${units[index]}`;
            }
          }
        }
      }
    }
  });
}

export { zeroLinePlugin, createOscillationChart, createEnergyChart };