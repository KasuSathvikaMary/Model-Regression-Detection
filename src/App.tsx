import {
  useState,
  type ChangeEvent,
} from "react";

import Papa from "papaparse";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ModelScene from "./components/3d/ModelScene";
import type { NodeData } from "./components/3d/NeuralNode";

/* =====================================================
   TYPES
   ===================================================== */

type Page = "dashboard" | "analytics";

type MetricKey =
  | "accuracy"
  | "precision"
  | "recall"
  | "f1"
  | "drift";

type DatasetRow = Record<
  string,
  string | number
>;

type DatasetInfo = {
  fileName: string;
  rows: number;
  columns: number;
  headers: string[];
};

type AnalysisStatus =
  | "HEALTHY"
  | "WARNING"
  | "REGRESSION";

/* =====================================================
   ANALYTICS DATA
   ===================================================== */

const analyticsData = [
  {
    day: "01",
    accuracy: 96.8,
    precision: 95.4,
    recall: 94.8,
    f1: 95.1,
    drift: 1.2,
  },
  {
    day: "05",
    accuracy: 97.1,
    precision: 95.8,
    recall: 95.2,
    f1: 95.5,
    drift: 1.5,
  },
  {
    day: "10",
    accuracy: 96.5,
    precision: 95.1,
    recall: 94.6,
    f1: 94.8,
    drift: 1.9,
  },
  {
    day: "15",
    accuracy: 95.9,
    precision: 94.7,
    recall: 93.9,
    f1: 94.3,
    drift: 2.4,
  },
  {
    day: "20",
    accuracy: 95.2,
    precision: 94.2,
    recall: 92.8,
    f1: 93.4,
    drift: 3.1,
  },
  {
    day: "22",
    accuracy: 94.6,
    precision: 93.6,
    recall: 91.9,
    f1: 92.7,
    drift: 3.8,
  },
  {
    day: "24",
    accuracy: 93.8,
    precision: 92.5,
    recall: 90.7,
    f1: 91.5,
    drift: 4.5,
  },
  {
    day: "26",
    accuracy: 92.7,
    precision: 91.6,
    recall: 89.4,
    f1: 90.5,
    drift: 5.1,
  },
  {
    day: "28",
    accuracy: 91.9,
    precision: 90.5,
    recall: 87.8,
    f1: 89.1,
    drift: 5.5,
  },
  {
    day: "30",
    accuracy: 91.6,
    precision: 89.4,
    recall: 86.2,
    f1: 87.7,
    drift: 5.7,
  },
];

/* =====================================================
   METRIC CONFIG
   ===================================================== */

const metricConfig: Record<
  MetricKey,
  {
    label: string;
    value: string;
    change: string;
    description: string;
  }
> = {
  accuracy: {
    label: "ACCURACY",
    value: "91.6%",
    change: "-4.6%",
    description:
      "Overall prediction correctness",
  },

  precision: {
    label: "PRECISION",
    value: "89.4%",
    change: "-5.3%",
    description:
      "Prediction reliability",
  },

  recall: {
    label: "RECALL",
    value: "86.2%",
    change: "-7.6%",
    description:
      "Detection coverage",
  },

  f1: {
    label: "F1 SCORE",
    value: "87.7%",
    change: "-6.5%",
    description:
      "Balance between precision and recall",
  },

  drift: {
    label: "DATA DRIFT",
    value: "5.7%",
    change: "+3.6%",
    description:
      "Production distribution shift",
  },
};

/* =====================================================
   METRIC COMPONENT
   ===================================================== */

function Metric({
  name,
  value,
  change,
}: {
  name: string;
  value: string;
  change: string;
}) {
  return (
    <div className="metric">
      <div className="metric-name">
        {name}
      </div>

      <div className="metric-value">
        {value}
      </div>

      <div className="metric-change">
        {change}
      </div>
    </div>
  );
}

/* =====================================================
   NODE INFORMATION PANEL
   ===================================================== */

function NodeInformationPanel({
  node,
  onClose,
}: {
  node: NodeData;
  onClose: () => void;
}) {
  return (
    <div className="node-info-card">
      <div className="node-info-header">
        <div>
          <div className="node-info-label">
            SELECTED NODE
          </div>

          <div className="node-info-title">
            {node.nodeName}
          </div>
        </div>

        <button
          className="clear-node"
          onClick={onClose}
          aria-label="Close node information"
        >
          ×
        </button>
      </div>

      <div
        className={`node-status ${node.status.toLowerCase()}`}
      >
        <span />
        {node.status}
      </div>

      <div className="node-info-grid">
        <div>
          <span>LAYER</span>

          <strong>
            {node.layerName}
          </strong>
        </div>

        <div>
          <span>ACTIVATION</span>

          <strong>
            {node.activation.toFixed(2)}
          </strong>
        </div>

        <div>
          <span>PERFORMANCE</span>

          <strong>
            {(
              node.performance * 100
            ).toFixed(1)}
            %
          </strong>
        </div>

        <div>
          <span>DATA DRIFT</span>

          <strong>
            {(
              node.drift * 100
            ).toFixed(1)}
            %
          </strong>
        </div>
      </div>

      {node.status ===
        "REGRESSION" && (
        <div className="node-warning">
          ⚠ Performance degradation
          detected in this node.
        </div>
      )}

      {node.status ===
        "WARNING" && (
        <div className="node-warning warning">
          ⚠ Elevated drift detected.
          Monitor this node.
        </div>
      )}

      {node.status ===
        "HEALTHY" && (
        <div className="node-warning healthy">
          ✓ Node operating within
          expected parameters.
        </div>
      )}
    </div>
  );
}

/* =====================================================
   DATASET CARD
   ===================================================== */

function DatasetCard({
  dataset,
  datasetInfo,
  uploadError,
  datasetAnalyzing,
  datasetAnalyzed,
  onUpload,
  onAnalyze,
}: {
  dataset: DatasetRow[];
  datasetInfo: DatasetInfo | null;
  uploadError: string;
  datasetAnalyzing: boolean;
  datasetAnalyzed: boolean;
  onUpload: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onAnalyze: () => void;
}) {
  return (
    <div className="dataset-card">
      <div className="panel-title">
        DATASET ANALYSIS
      </div>

      {!datasetInfo ? (
        <>
          <div className="dataset-upload">
            <div className="upload-icon">
              ↑
            </div>

            <strong>
              UPLOAD CSV DATASET
            </strong>

            <span>
              Select a CSV file to inspect
              your production data
            </span>

            <label className="upload-button">
              📁 CHOOSE CSV FILE

              <input
                type="file"
                accept=".csv"
                onChange={onUpload}
                hidden
              />
            </label>
          </div>

          {uploadError && (
            <div className="upload-error">
              ⚠ {uploadError}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="dataset-file">
            <div className="dataset-file-icon">
              CSV
            </div>

            <div>
              <strong>
                {datasetInfo.fileName}
              </strong>

              <span>
                {datasetInfo.rows.toLocaleString()}{" "}
                rows •{" "}
                {datasetInfo.columns}{" "}
                features
              </span>
            </div>
          </div>

          <div className="dataset-stats">
            <div>
              <span>ROWS</span>

              <strong>
                {datasetInfo.rows.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>FEATURES</span>

              <strong>
                {datasetInfo.columns}
              </strong>
            </div>
          </div>

          <div className="dataset-preview">
            <div className="preview-title">
              DATA PREVIEW
            </div>

            <div className="preview-table">
              <div className="preview-row preview-header">
                {datasetInfo.headers
                  .slice(0, 5)
                  .map((header) => (
                    <span key={header}>
                      {header}
                    </span>
                  ))}
              </div>

              {dataset
                .slice(0, 5)
                .map((row, index) => (
                  <div
                    className="preview-row"
                    key={index}
                  >
                    {datasetInfo.headers
                      .slice(0, 5)
                      .map((header) => (
                        <span key={header}>
                          {String(
                            row[header] ??
                              "-"
                          )}
                        </span>
                      ))}
                  </div>
                ))}
            </div>
          </div>

          <button
            className={`analysis-button ${
              datasetAnalyzing
                ? "analyzing"
                : ""
            }`}
            onClick={onAnalyze}
            disabled={datasetAnalyzing}
          >
            {datasetAnalyzing ? (
              <>
                <span className="button-spinner" />
                ANALYZING DATASET...
              </>
            ) : (
              <>🔬 ANALYZE DATASET</>
            )}
          </button>

          {datasetAnalyzed && (
            <div className="dataset-result">
              <div className="result-title">
                ✓ DATASET ANALYSIS COMPLETE
              </div>

              <div className="dataset-result-grid">
                <div>
                  <span>
                    MODEL HEALTH
                  </span>

                  <strong>
                    92.7%
                  </strong>
                </div>

                <div>
                  <span>
                    REGRESSION RISK
                  </span>

                  <strong>
                    7.3%
                  </strong>
                </div>

                <div>
                  <span>
                    DATA DRIFT
                  </span>

                  <strong>
                    4.6%
                  </strong>
                </div>
              </div>

              <div className="dataset-warning">
                ⚠ Potential distribution
                shift detected.
              </div>
            </div>
          )}

          <label className="change-dataset">
            ↻ CHANGE DATASET

            <input
              type="file"
              accept=".csv"
              onChange={onUpload}
              hidden
            />
          </label>
        </>
      )}
    </div>
  );
}

/* =====================================================
   DASHBOARD
   ===================================================== */

function DashboardPage() {
  const [
    selectedNode,
    setSelectedNode,
  ] = useState<NodeData | null>(null);

  const [
    analysisRunning,
    setAnalysisRunning,
  ] = useState(false);

  const [
    analysisProgress,
    setAnalysisProgress,
  ] = useState(0);

  const [
    analysisComplete,
    setAnalysisComplete,
  ] = useState(false);

  const [
    modelHealth,
    setModelHealth,
  ] = useState(94.8);

  const [
    regressionRisk,
    setRegressionRisk,
  ] = useState(4.8);

  const [
    analysisStatus,
    setAnalysisStatus,
  ] =
    useState<AnalysisStatus>(
      "HEALTHY"
    );

  const [
    investigating,
    setInvestigating,
  ] = useState(false);

  const [
    investigationComplete,
    setInvestigationComplete,
  ] = useState(false);

  const [
    investigationProgress,
    setInvestigationProgress,
  ] = useState(0);

  const [
    reportGenerated,
    setReportGenerated,
  ] = useState(false);

  const [
    lastAnalysis,
    setLastAnalysis,
  ] = useState("2 MIN AGO");

  /* DATASET */

  const [dataset, setDataset] =
    useState<DatasetRow[]>([]);

  const [datasetInfo, setDatasetInfo] =
    useState<DatasetInfo | null>(
      null
    );

  const [uploadError, setUploadError] =
    useState("");

  const [
    datasetAnalyzing,
    setDatasetAnalyzing,
  ] = useState(false);

  const [
    datasetAnalyzed,
    setDatasetAnalyzed,
  ] = useState(false);

  /* ===================================================
     NODE SELECTION
     =================================================== */

  const handleNodeSelect = (
    node: NodeData
  ) => {
    /*
     * IMPORTANT:
     * We replace the selected node
     * instead of toggling it.
     *
     * Therefore:
     * Node 1 -> Node 3
     * immediately moves the panel.
     */
    setSelectedNode(node);
  };

  const clearSelectedNode = () => {
    setSelectedNode(null);
  };

  /* ===================================================
     CSV UPLOAD
     =================================================== */

  const handleDatasetUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setUploadError("");
    setDatasetAnalyzed(false);

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setUploadError(
        "Please upload a CSV file."
      );

      event.target.value = "";
      return;
    }

    Papa.parse<DatasetRow>(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        const rows =
          results.data.filter(
            (row) =>
              Object.keys(row).length >
              0
          );

        if (!rows.length) {
          setUploadError(
            "The uploaded CSV contains no usable data."
          );

          return;
        }

        const headers =
          Object.keys(rows[0]);

        setDataset(rows);

        setDatasetInfo({
          fileName: file.name,
          rows: rows.length,
          columns:
            headers.length,
          headers,
        });
      },

      error: () => {
        setUploadError(
          "Unable to read the CSV file."
        );
      },
    });

    event.target.value = "";
  };

  /* ===================================================
     DATASET ANALYSIS
     =================================================== */

  const analyzeDataset = () => {
    if (
      !dataset.length ||
      datasetAnalyzing
    ) {
      return;
    }

    setDatasetAnalyzing(true);

    window.setTimeout(() => {
      setDatasetAnalyzing(false);
      setDatasetAnalyzed(true);

      setRegressionRisk(7.3);
      setModelHealth(92.7);
      setAnalysisStatus(
        "WARNING"
      );

      setLastAnalysis(
        "JUST NOW"
      );
    }, 2500);
  };

  /* ===================================================
     RUN MODEL ANALYSIS
     =================================================== */

  const runAnalysis = () => {
    if (analysisRunning) return;

    setSelectedNode(null);

    setAnalysisRunning(true);
    setAnalysisComplete(false);
    setAnalysisProgress(0);

    setInvestigating(false);
    setInvestigationComplete(false);
    setInvestigationProgress(0);

    setReportGenerated(false);

    const duration = 5000;
    const intervalTime = 100;
    const totalSteps =
      duration / intervalTime;

    let currentStep = 0;

    const interval =
      window.setInterval(() => {
        currentStep++;

        const progress =
          Math.min(
            Math.round(
              (currentStep /
                totalSteps) *
                100
            ),
            100
          );

        setAnalysisProgress(
          progress
        );

        if (progress >= 100) {
          window.clearInterval(
            interval
          );

          setModelHealth(91.6);
          setRegressionRisk(8.4);

          setAnalysisStatus(
            "WARNING"
          );

          setAnalysisRunning(
            false
          );

          setAnalysisComplete(
            true
          );

          setLastAnalysis(
            "JUST NOW"
          );
        }
      }, intervalTime);
  };

  /* ===================================================
     INVESTIGATE
     =================================================== */

  const investigateRegression =
    () => {
      if (
        investigating ||
        !analysisComplete
      ) {
        return;
      }

      setInvestigating(true);
      setInvestigationComplete(
        false
      );
      setInvestigationProgress(
        0
      );

      const duration = 4000;
      const intervalTime = 100;
      const totalSteps =
        duration / intervalTime;

      let currentStep = 0;

      const interval =
        window.setInterval(() => {
          currentStep++;

          const progress =
            Math.min(
              Math.round(
                (currentStep /
                  totalSteps) *
                  100
              ),
              100
            );

          setInvestigationProgress(
            progress
          );

          if (progress >= 100) {
            window.clearInterval(
              interval
            );

            setInvestigating(
              false
            );

            setInvestigationComplete(
              true
            );
          }
        }, intervalTime);
    };

  /* ===================================================
     REPORT
     =================================================== */

  const generateReport = () => {
    setReportGenerated(true);
  };

  /* ===================================================
     RESET
     =================================================== */

  const resetSystem = () => {
    setSelectedNode(null);

    setAnalysisRunning(false);
    setAnalysisProgress(0);
    setAnalysisComplete(false);

    setInvestigating(false);
    setInvestigationComplete(
      false
    );

    setInvestigationProgress(0);
    setReportGenerated(false);

    setModelHealth(94.8);
    setRegressionRisk(4.8);

    setAnalysisStatus(
      "HEALTHY"
    );

    setLastAnalysis(
      "2 MIN AGO"
    );
  };

  const degraded =
    analysisComplete ||
    datasetAnalyzed;

  return (
    <div className="dashboard">

      {/* =================================================
          LEFT PANEL
          ================================================= */}

      <section className="left-panel">
        <div className="eyebrow">
          AI MODEL MONITORING
        </div>

        <h1>
          Model
          <br />

          <span>
            Regression
          </span>

          <br />

          Detection
        </h1>

        <p className="description">
          Real-time monitoring of
          machine learning model
          performance, drift and
          regression risk.
        </p>

        {/* HEALTH */}

        <div className="health-card">
          <div>
            <div className="small-label">
              MODEL HEALTH
            </div>

            <div className="health-number">
              {modelHealth.toFixed(1)}
              <span>%</span>
            </div>
          </div>

          <div className="health-status">
            <span
              className={`status-dot ${
                analysisStatus !==
                "HEALTHY"
                  ? "warning-dot"
                  : ""
              }`}
            />

            {analysisStatus}
          </div>
        </div>

        {/* RISK */}

        <div className="risk">
          <div className="risk-header">
            <span>
              REGRESSION RISK
            </span>

            <strong>
              {regressionRisk.toFixed(
                1
              )}
              %
            </strong>
          </div>

          <div className="risk-bar">
            <div
              className="risk-progress"
              style={{
                width: `${Math.min(
                  regressionRisk *
                    2,
                  100
                )}%`,
              }}
            />
          </div>

          <div className="risk-label">
            {analysisStatus ===
            "HEALTHY"
              ? "Low probability of performance degradation"
              : "Elevated probability of performance degradation"}
          </div>
        </div>

        {/* RUN ANALYSIS */}

        <button
          className={`analysis-button ${
            analysisRunning
              ? "analyzing"
              : ""
          }`}
          onClick={runAnalysis}
          disabled={analysisRunning}
        >
          {analysisRunning ? (
            <>
              <span className="button-spinner" />
              ANALYZING...
            </>
          ) : (
            <>▶ RUN ANALYSIS</>
          )}
        </button>

        {/* ANALYSIS PROGRESS */}

        {analysisRunning && (
          <div className="analysis-progress-card">
            <div className="progress-header">
              <span>
                MODEL ANALYSIS
              </span>

              <strong>
                {analysisProgress}%
              </strong>
            </div>

            <div className="analysis-progress-bar">
              <div
                style={{
                  width: `${analysisProgress}%`,
                }}
              />
            </div>

            <div className="analysis-step">
              {analysisProgress <
                20 &&
                "Loading baseline model..."}

              {analysisProgress >=
                20 &&
                analysisProgress <
                  40 &&
                "Checking model performance..."}

              {analysisProgress >=
                40 &&
                analysisProgress <
                  60 &&
                "Analyzing data drift..."}

              {analysisProgress >=
                60 &&
                analysisProgress <
                  80 &&
                "Comparing model versions..."}

              {analysisProgress >=
                80 &&
                "Calculating regression risk..."}
            </div>
          </div>
        )}

        {/* ANALYSIS RESULT */}

        {analysisComplete && (
          <div className="analysis-result">
            <div className="result-title">
              ⚠ ANALYSIS COMPLETE
            </div>

            <div className="result-status">
              WARNING
            </div>

            <p>
              Performance degradation
              risk has increased.
            </p>

            <div className="result-cause">
              <span>
                PRIMARY CAUSE
              </span>

              <strong>
                Data Drift
              </strong>
            </div>

            <button
              className="analysis-button"
              onClick={
                investigateRegression
              }
              disabled={investigating}
            >
              {investigating ? (
                <>
                  <span className="button-spinner" />
                  INVESTIGATING...
                </>
              ) : (
                <>
                  ◉ INVESTIGATE
                  REGRESSION
                </>
              )}
            </button>
          </div>
        )}

        {/* INVESTIGATION */}

        {investigating && (
          <div className="analysis-progress-card">
            <div className="progress-header">
              <span>
                AI ROOT CAUSE ANALYSIS
              </span>

              <strong>
                {investigationProgress}%
              </strong>
            </div>

            <div className="analysis-progress-bar">
              <div
                style={{
                  width: `${investigationProgress}%`,
                }}
              />
            </div>

            <div className="analysis-step">
              {investigationProgress <
                25 &&
                "Examining feature distributions..."}

              {investigationProgress >=
                25 &&
                investigationProgress <
                  50 &&
                "Tracing performance degradation..."}

              {investigationProgress >=
                50 &&
                investigationProgress <
                  75 &&
                "Evaluating contributing factors..."}

              {investigationProgress >=
                75 &&
                "Generating AI recommendation..."}
            </div>
          </div>
        )}

        {/* FINDINGS */}

        {investigationComplete && (
          <div className="finding-card">
            <div className="panel-title">
              AI ROOT CAUSE ANALYSIS
            </div>

            {[
              [
                "01",
                "Data Distribution Drift",
                "Confidence: 72%",
              ],
              [
                "02",
                "Feature drift detected across recent samples.",
                "",
              ],
              [
                "03",
                "Recall degradation is contributing to the regression.",
                "",
              ],
              [
                "04",
                "Model variance increased after the latest data distribution shift.",
                "",
              ],
            ].map(
              ([number, text, sub]) => (
                <div
                  className="finding"
                  key={number}
                >
                  <span>
                    {number}
                  </span>

                  <div>
                    <strong>
                      {text}
                    </strong>

                    {sub && (
                      <>
                        <br />

                        <small>
                          {sub}
                        </small>
                      </>
                    )}
                  </div>
                </div>
              )
            )}

            <button
              className="analysis-button"
              onClick={
                generateReport
              }
            >
              📄 GENERATE REPORT
            </button>

            {reportGenerated && (
              <div className="node-status">
                <span />
                REPORT READY
              </div>
            )}
          </div>
        )}

        {/* DATASET */}

        <DatasetCard
          dataset={dataset}
          datasetInfo={datasetInfo}
          uploadError={uploadError}
          datasetAnalyzing={
            datasetAnalyzing
          }
          datasetAnalyzed={
            datasetAnalyzed
          }
          onUpload={
            handleDatasetUpload
          }
          onAnalyze={
            analyzeDataset
          }
        />

        {/* RESET */}

        {(analysisComplete ||
          investigationComplete ||
          datasetAnalyzed) && (
          <button
            className="analysis-button"
            onClick={resetSystem}
          >
            ↻ RESET MONITORING
          </button>
        )}
      </section>

      {/* =================================================
          CENTER 3D MODEL
          ================================================= */}

      <section className="center-panel">

        <div className="scene-label">
          <span className="pulse" />

          {analysisRunning
            ? "ANALYZING MODEL ARCHITECTURE"
            : selectedNode
              ? `NODE SELECTED • ${selectedNode.nodeName.toUpperCase()}`
              : "LIVE MODEL ARCHITECTURE"}
        </div>

        <div
          className="scene"
          onClick={(event) => {
            /*
             * Clicking the scene background
             * clears the current node.
             *
             * stopPropagation inside NeuralNode
             * prevents this from firing when
             * clicking an actual node.
             */
            if (
              event.target ===
              event.currentTarget
            ) {
              clearSelectedNode();
            }
          }}
        >
          <ModelScene
            running={analysisRunning}
            selectedNodeId={
              selectedNode?.id ??
              null
            }
            onSelectNode={
              handleNodeSelect
            }
          />
        </div>

        <div className="scene-bottom">
          <span>INPUT</span>

          <span>
            HIDDEN LAYERS
          </span>

          <span>OUTPUT</span>
        </div>

        {/* NODE INFORMATION */}

        {selectedNode && (
          <NodeInformationPanel
            node={selectedNode}
            onClose={
              clearSelectedNode
            }
          />
        )}
      </section>

      {/* =================================================
          RIGHT PANEL
          ================================================= */}

      <section className="right-panel">

        <div className="panel-title">
          PERFORMANCE METRICS
        </div>

        <div className="metrics">

          <Metric
            name="ACCURACY"
            value={
              degraded
                ? "91.6%"
                : "96.2%"
            }
            change={
              degraded
                ? "-4.6%"
                : "+1.4%"
            }
          />

          <Metric
            name="PRECISION"
            value="89.4%"
            change="-5.3%"
          />

          <Metric
            name="RECALL"
            value="86.2%"
            change="-7.6%"
          />

          <Metric
            name="F1 SCORE"
            value="87.7%"
            change="-6.5%"
          />

        </div>

        {/* DRIFT */}

        <div className="drift-card">
          <div className="panel-title">
            DATA DRIFT
          </div>

          <div className="drift-value">
            {degraded
              ? "5.7%"
              : "2.1%"}
          </div>

          <div
            className={`drift-status ${
              degraded
                ? "drift-warning"
                : ""
            }`}
          >
            ●{" "}
            {degraded
              ? "ELEVATED"
              : "STABLE"}
          </div>

          <div className="mini-chart">
            {[
              30,
              42,
              35,
              58,
              48,
              65,
              55,
              72,
              61,
              degraded
                ? 92
                : 76,
            ].map(
              (height, index) => (
                <span
                  key={index}
                  style={{
                    height: `${height}%`,
                  }}
                />
              )
            )}
          </div>
        </div>

        {/* FINDINGS */}

        {degraded && (
          <div className="finding-card">
            <div className="panel-title">
              KEY FINDINGS
            </div>

            <div className="finding">
              <span>01</span>

              <div>
                Accuracy decreased
                by 4.6%.
              </div>
            </div>

            <div className="finding">
              <span>02</span>

              <div>
                Data drift increased
                to 5.7%.
              </div>
            </div>

            <div className="finding">
              <span>03</span>

              <div>
                Recall degradation
                detected.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =================================================
          FOOTER
          ================================================= */}

      <footer className="footer">

        <div>
          <span className="footer-dot" />

          MONITORING ACTIVE
        </div>

        <div>
          LAST ANALYSIS:
          {" "}
          {lastAnalysis}
        </div>

        <div>
          DATASET:
          {" "}
          {datasetInfo?.fileName ??
            "CUSTOMER_BEHAVIOR_V4"}
        </div>

      </footer>
    </div>
  );
}

/* =====================================================
   ANALYTICS PAGE
   ===================================================== */

function AnalyticsPage() {
  const [
    selectedMetric,
    setSelectedMetric,
  ] = useState<MetricKey>(
    "accuracy"
  );

  const metric =
    metricConfig[selectedMetric];

  return (
    <div className="analytics-page">

      <div className="analytics-header">

        <div>
          <div className="eyebrow">
            MODEL INTELLIGENCE
          </div>

          <h2>
            Performance
            <span>
              {" "}
              Analytics
            </span>
          </h2>

          <p>
            Track model performance,
            regression signals and
            data distribution changes
            over time.
          </p>
        </div>

        <div className="analytics-health">
          <span className="online-dot" />
          LIVE MONITORING
        </div>

      </div>

      <div className="metric-selector">

        {(
          Object.keys(
            metricConfig
          ) as MetricKey[]
        ).map((key) => (
          <button
            key={key}
            className={
              selectedMetric === key
                ? "metric-tab active"
                : "metric-tab"
            }
            onClick={() =>
              setSelectedMetric(key)
            }
          >
            {metricConfig[key].label}
          </button>
        ))}

      </div>

      <div className="analytics-grid">

        <div className="analytics-chart-card">

          <div className="chart-header">

            <div>
              <div className="chart-label">
                {metric.label}
              </div>

              <div className="chart-value">
                {metric.value}
              </div>

              <div className="chart-description">
                {metric.description}
              </div>
            </div>

            <div className="chart-change negative">
              {metric.change}
            </div>

          </div>

          <div className="chart-wrapper">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={analyticsData}
              >

                <defs>
                  <linearGradient
                    id="metricGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#00e5ff"
                      stopOpacity={0.32}
                    />

                    <stop
                      offset="100%"
                      stopColor="#00e5ff"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  stroke="#4e5872"
                  tick={{
                    fill: "#59637c",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  domain={
                    selectedMetric ===
                    "drift"
                      ? [0, 10]
                      : [80, 100]
                  }
                  stroke="#4e5872"
                  tick={{
                    fill: "#59637c",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background:
                      "rgba(9,12,22,0.96)",
                    border:
                      "1px solid rgba(0,229,255,0.18)",
                    borderRadius:
                      "10px",
                    color: "#fff",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey={
                    selectedMetric
                  }
                  stroke="#00e5ff"
                  strokeWidth={2}
                  fill="url(#metricGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "#00e5ff",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />

              </AreaChart>
            </ResponsiveContainer>

          </div>

          <div className="chart-footer">
            <span>DAY 01</span>

            <span>
              REGRESSION EVENT
            </span>

            <span>DAY 30</span>
          </div>

        </div>

        <div className="analytics-side">

          <div className="analytics-status-card">

            <div className="panel-title">
              CURRENT STATUS
            </div>

            <div className="analytics-score">
              {metric.value}
            </div>

            <div className="status-warning">
              ● REGRESSION DETECTED
            </div>

            <div className="status-divider" />

            <div className="status-row">
              <span>
                Baseline
              </span>

              <strong>
                {selectedMetric ===
                "drift"
                  ? "2.1%"
                  : "96.2%"}
              </strong>
            </div>

            <div className="status-row">
              <span>
                Current
              </span>

              <strong>
                {metric.value}
              </strong>
            </div>

            <div className="status-row">
              <span>
                Change
              </span>

              <strong className="negative">
                {metric.change}
              </strong>
            </div>

          </div>

          <div className="mini-metrics-card">

            <div className="panel-title">
              MODEL SNAPSHOT
            </div>

            {[
              ["Accuracy", "91.6%"],
              ["Precision", "89.4%"],
              ["Recall", "86.2%"],
              ["F1 Score", "87.7%"],
            ].map(
              ([label, value]) => (
                <div
                  className="mini-metric-row"
                  key={label}
                >
                  <span>
                    {label}
                  </span>

                  <strong>
                    {value}
                  </strong>
                </div>
              )
            )}

            <div className="mini-metric-row">

              <span>
                Data Drift
              </span>

              <strong className="warning-text">
                5.7%
              </strong>

            </div>

          </div>

        </div>
      </div>

      <div className="analytics-lower">

        <div className="analytics-panel">

          <div className="panel-title">
            FEATURE DRIFT
          </div>

          <div className="feature-list">

            {[
              [
                "Purchase Frequency",
                "87%",
                "8.7%",
              ],
              [
                "Session Duration",
                "100%",
                "11.4%",
              ],
              [
                "Income",
                "34%",
                "2.4%",
              ],
              [
                "Age",
                "17%",
                "1.2%",
              ],
            ].map(
              ([name, width, value]) => (
                <div
                  className="feature-row"
                  key={name}
                >
                  <span>
                    {name}
                  </span>

                  <div className="feature-bar">
                    <div
                      style={{
                        width,
                      }}
                    />
                  </div>

                  <strong>
                    {value}
                  </strong>
                </div>
              )
            )}

          </div>
        </div>

        <div className="analytics-panel">

          <div className="panel-title">
            REGRESSION SUMMARY
          </div>

          <div className="regression-summary">

            <div className="summary-icon">
              ⚠
            </div>

            <div>
              <strong>
                Performance degradation
                detected
              </strong>

              <p>
                Model performance has
                declined consistently
                over the latest
                evaluation period.
              </p>
            </div>

          </div>

          <div className="recommendation">

            <span>
              AI RECOMMENDATION
            </span>

            <strong>
              Retrain with the latest
              production dataset.
            </strong>

          </div>

        </div>

      </div>
    </div>
  );
}

/* =====================================================
   MAIN APP
   ===================================================== */

function App() {
  const [
    page,
    setPage,
  ] = useState<Page>(
    "dashboard"
  );

  return (
    <div className="app">

      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <header className="topbar">

        <div className="brand">

          <div className="brand-icon">
            ◈
          </div>

          <div>

            <div className="brand-title">
              REGRESSION
              <span>AI</span>
            </div>

            <div className="brand-subtitle">
              MODEL REGRESSION
              DETECTION SYSTEM
            </div>

          </div>
        </div>

        <nav className="main-nav">

          <button
            className={
              page === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage("dashboard")
            }
          >
            DASHBOARD
          </button>

          <button
            className={
              page === "analytics"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage("analytics")
            }
          >
            ANALYTICS
          </button>

        </nav>

        <div className="model-info">

          <div className="version">
            MODEL v2.4.1
          </div>

          <div className="online">

            <span className="online-dot" />

            SYSTEM ONLINE

          </div>

        </div>

      </header>

      {page === "dashboard" ? (
        <DashboardPage />
      ) : (
        <AnalyticsPage />
      )}

    </div>
  );
}

export default App;