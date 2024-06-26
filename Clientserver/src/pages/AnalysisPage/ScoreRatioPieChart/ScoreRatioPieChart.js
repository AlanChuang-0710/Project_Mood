import React, { useState, useRef, useEffect } from 'react';
import { useMantineTheme, } from "@mantine/core";
import * as echarts from 'echarts';
import Tracker from '@/components/BuryPoint/BuryPoint';

const ScoreRatioPieChart = ({ height, scorePieChartData }) => {
    const scoreRatioPieDOM = useRef(null);
    const [scoreRatioPieChart, setScoreRaioPieChart] = useState(null);
    const theme = useMantineTheme();
    useEffect(() => {
        let data;
        let option;
        if (!scoreRatioPieChart) {
            setScoreRaioPieChart(echarts.init(scoreRatioPieDOM.current));
        };
        if (scoreRatioPieChart && scorePieChartData?.data) {
            const colorMap = theme.colors.emotion;
            const nameMap = ["Depressed", "Sad", "Peace", "Smile", "Happy"];
            // 處理顯示的name和color
            data = scorePieChartData.data.data.map((item) => {
                return {
                    ...item,
                    value: item.count,
                    name: item.score === null ? "No record" : nameMap[item.score + 2],
                    itemStyle: {
                        color: item.score === null ? colorMap[colorMap.length - 1] : colorMap[item.score + 2]
                    }
                };
            });
            option = {
                tooltip: {
                    trigger: "item",
                    confine: false,
                    formatter: (params) => `<div style="font-size: 18px; margin:0 0; display: flex; align-items: center; ">
                    <span style=" width: 8px; height: 8px; background-color:${params.color}; border-radius:50%; margin-right: 6px"></span>
                    <span style="margin-right: 10px">${params.data.name}</span>
                    <span>${params.data.value} ${params.data.value > 1 ? "days" : "day"}</span>
                    </div>
                    `,
                },
                title: {
                    // text: 'Score Pie',
                    // subtext: 'Fake Data',
                    // left: 'center'
                },
                label: {
                    show: true,
                },
                labelLine: {
                    show: true
                },

                series: [
                    {
                        name: 'Score Pie',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        avoidLabelOverlap: false,

                        itemStyle: {
                            borderRadius: 10,
                            borderColor: '#fff',
                            borderWidth: 2
                        },

                        // emphasis: {
                        //     label: {
                        //         show: true,
                        //         fontSize: 20,
                        //     }
                        // },

                        data
                    }
                ]
            };
            scoreRatioPieChart.setOption(option);
        }

        const handleResize = () => scoreRatioPieChart?.resize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [scoreRatioPieChart, scorePieChartData, theme]);

    return (
        <Tracker type="view" bpId="1000">
            <div ref={scoreRatioPieDOM} style={{ height: height + "px" }}></div>
        </Tracker>
    );
};

export default ScoreRatioPieChart;;;;;