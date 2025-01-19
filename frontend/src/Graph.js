import React, { useState, useEffect, useRef } from 'react';
import { Graph as D3Graph } from 'react-d3-graph';
import * as d3 from 'd3';

const Graph = ({ notes, links, onNodeClick, activeTab }) => {
    const [dimensions, setDimensions] = useState({
        height: window.innerHeight,
        width: window.innerWidth - 200
    });
    const containerRef = useRef(null);
    const simulationRef = useRef(null);

    // Handle visibility change
    useEffect(() => {
        const updateGraphWhenVisible = () => {
            if (document.visibilityState === 'visible' && activeTab === 'graph') {
                // Get actual dimensions when visible
                const width = containerRef.current?.offsetWidth || window.innerWidth - 200;
                const height = containerRef.current?.offsetHeight || window.innerHeight;
                
                setDimensions({ width, height });

                // Restart simulation with new dimensions
                if (simulationRef.current) {
                    simulationRef.current
                        .force('center', d3.forceCenter(width / 2, height / 2))
                        .alpha(1)
                        .restart();
                }
            }
        };

        document.addEventListener('visibilitychange', updateGraphWhenVisible);
        return () => document.removeEventListener('visibilitychange', updateGraphWhenVisible);
    }, [activeTab]);

    // Handle tab changes
    useEffect(() => {
        if (activeTab === 'graph') {
            // Short delay to ensure container is rendered
            setTimeout(() => {
                const width = containerRef.current?.offsetWidth || window.innerWidth - 200;
                const height = containerRef.current?.offsetHeight || window.innerHeight;
                setDimensions({ width, height });

                // Initialize simulation
                const simulation = d3.forceSimulation()
                    .force('center', d3.forceCenter(width / 2, height / 2))
                    .force('charge', d3.forceManyBody().strength(-400))
                    .force('link', d3.forceLink().distance(200));

                simulationRef.current = simulation;
                simulation.alpha(1).restart();
            }, 100);
        }
    }, [activeTab]);

    const config = {
        nodeHighlightBehavior: true,
        node: {
            color: "#2a4a7f",
            size: 800,
            highlightStrokeColor: "#60a5fa",
            highlightColor: "#60a5fa",
            fontSize: 16,
            highlightFontSize: 16,
            fontColor: "white",
            highlightFontColor: "white",
            labelProperty: "label",
            strokeWidth: 1.5,
            highlightStrokeWidth: 2,
            renderLabel: true,
            symbolType: "circle",
            highlightDegree: 0,
            opacity: 1
        },
        link: {
            highlightColor: "#4a5568",
            color: "#4a5568",
            strokeWidth: 2,
            highlightStrokeWidth: 2,
            type: "STRAIGHT",
            highlightDegree: 0
        },
        d3: {
            gravity: -400,
            linkLength: 200,
            linkStrength: 1,
            alphaTarget: 0.05,
            repulsion: 1000,
            disableLinkForce: false
        },
        automaticRearrangeAfterDropNode: false,
        centerGraph: true,
        height: dimensions.height,
        width: dimensions.width,
        directed: false,
        initialZoom: 0.6,
        panAndZoom: true,
        staticGraph: false,
        collapsible: false
    };

    const handleNodeClick = (nodeId) => {
        // Find the full note data that matches the clicked node
        const clickedNote = notes.find(note => note.id === nodeId);
        if (clickedNote) {
            onNodeClick(clickedNote);
        }
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            {notes.length > 0 && activeTab === 'graph' && (
                <D3Graph
                    id="graph-id"
                    data={{
                        nodes: notes.map(note => ({
                            id: note.id,
                            title: note.title,
                            label: note.title,
                            color: "#2a4a7f",
                            content: note.content,
                            dateCreated: note.dateCreated,
                            createdBy: note.createdBy,
                            comments: note.comments,
                            links: note.links,
                            initialComments: note.initialComments
                        })),
                        links: links.map(link => ({
                            source: link.sourceId,
                            target: link.targetId
                        }))
                    }}
                    config={config}
                    onClickNode={handleNodeClick}
                />
            )}
        </div>
    );
};

export default Graph;
