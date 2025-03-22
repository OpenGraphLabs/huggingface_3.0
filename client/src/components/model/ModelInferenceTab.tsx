import { Box, Flex, Heading, Text, Card, TextArea, Badge, Table, Button, Code } from "@radix-ui/themes";
import { InfoCircledIcon, ReloadIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useModelInferenceState } from "../../hooks/useModelInference";
import { getActivationTypeName, formatVector } from "../../utils/modelUtils";
import { SUI_NETWORK } from "../../constants/suiConfig";

interface ModelInferenceTabProps {
  model: {
    id: string;
    name: string;
    task_type: string;
    graphs: any[];
  };
}

export function ModelInferenceTab({ model }: ModelInferenceTabProps) {
  const [promptText, setPromptText] = useState("");
  const [inferenceResult, setInferenceResult] = useState("");
  const [isInferenceLoading, setIsInferenceLoading] = useState(false);

  // 레이어 수 가져오기
  const getLayerCount = () => {
    if (!model.graphs || model.graphs.length === 0) return 0;
    return model.graphs[0].layers.length;
  };

  // 추론 관련 훅 사용
  const {
    inputVector,
    currentLayerIndex,
    predictResults,
    inferenceStatus,
    isProcessing,
    txDigest,
    setInputVector,
    startInference,
    predictNextLayer
  } = useModelInferenceState(model.id, getLayerCount());

  // Function to get Sui Scan URL
  const getSuiScanUrl = (type: 'transaction' | 'object', id: string) => {
    const baseUrl = `https://suiscan.xyz/${SUI_NETWORK.TYPE}`;
    return type === 'transaction' 
      ? `${baseUrl}/tx/${id}`
      : `${baseUrl}/object/${id}`;
  };

  // 간단한 텍스트 추론 기능 (현재 시뮬레이션)
  const runInference = async () => {
    if (!promptText.trim()) return;

    setIsInferenceLoading(true);

    // In a real implementation, this would communicate with the Sui blockchain for on-chain inference
    // This is just a simulation
    setTimeout(() => {
      let result = "";

      if (model.task_type === "text-generation") {
        result = `${promptText}\n\nThis is a text response generated by the ${model.name} model. In a real implementation, inference would be executed on the Sui blockchain.`;
      } else if (model.task_type === "translation") {
        result = `Translation result: This is text translated by the ${model.name} model.`;
      } else {
        result = `Inference result from ${model.name} model.`;
      }

      setInferenceResult(result);
      setIsInferenceLoading(false);
    }, 1500);
  };

  return (
    <Card style={{ border: "none", boxShadow: "none" }}>
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="4" style={{ color: "#FF5733", fontWeight: 700 }}>
            On-chain Inference
          </Heading>
          <Button
            variant="soft"
            style={{ background: "#FFF4F2", color: "#FF5733" }}
            onClick={() => window.open(getSuiScanUrl('object', model.id), '_blank')}
          >
            <Text size="2">View Model on Sui Scan</Text>
          </Button>
        </Flex>
        
        <Text style={{ lineHeight: "1.6" }}>
          This model's inference runs directly on the Sui blockchain. Observe the results layer by layer.
        </Text>

        <Card style={{ padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
          <Flex gap="2" align="center" mb="3">
            <InfoCircledIcon style={{ color: "#FF5733" }} />
            <Text size="2" style={{ fontWeight: 500 }}>
              Provide an input vector to see results as the model processes each layer sequentially.
              The output of each layer automatically becomes the input for the next layer.
            </Text>
          </Flex>
        </Card>

        <Box style={{ background: "#F5F5F5", padding: "16px", borderRadius: "8px" }}>
          <Heading size="3" mb="2">
            Model Vector Input
          </Heading>
          <Text size="2" mb="2">
            Enter input vector values separated by commas:
          </Text>
          <TextArea
            placeholder="Example: 1.0, 2.5, -3.0, 4.2, -1.5"
            value={inputVector}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputVector(e.target.value)}
            style={{
              minHeight: "80px",
              borderRadius: "8px",
              border: "1px solid var(--gray-5)",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "monospace",
            }}
          />
        </Box>
        
        <Flex justify="between" align="center" mt="3" mb="3">
          <Flex align="center" gap="2">
            <Text size="2" style={{ fontWeight: 600 }}>
              Model Structure: {getLayerCount()} Layers
            </Text>
          </Flex>
          <Flex align="center" gap="2">
            <Text size="2" style={{ fontWeight: 600 }}>
              Current Layer: {currentLayerIndex}/{getLayerCount()}
            </Text>
          </Flex>
        </Flex>

        <Flex gap="2">
          <Button
            onClick={startInference}
            disabled={isProcessing || !inputVector.trim()}
            style={{
              background: "#FF5733",
              color: "white",
              borderRadius: "8px",
              opacity: isProcessing || !inputVector.trim() ? 0.6 : 1,
            }}
          >
            {isProcessing ? (
              <Flex align="center" gap="2">
                <ReloadIcon style={{ animation: "spin 1s linear infinite" }} />
                <span>Processing...</span>
              </Flex>
            ) : (
              <span>Start Inference</span>
            )}
          </Button>
          
          <Button
            onClick={predictNextLayer}
            disabled={isProcessing || predictResults.length === 0 || currentLayerIndex >= getLayerCount()}
            style={{
              background: "#FF7A00",
              color: "white",
              borderRadius: "8px",
              opacity: isProcessing || predictResults.length === 0 || currentLayerIndex >= getLayerCount() ? 0.6 : 1,
            }}
          >
            {isProcessing ? (
              <Flex align="center" gap="2">
                <ReloadIcon style={{ animation: "spin 1s linear infinite" }} />
                <span>Processing...</span>
              </Flex>
            ) : (
              <Flex align="center" gap="2">
                <span>Next Layer Manually</span>
                <ArrowRightIcon />
              </Flex>
            )}
          </Button>
        </Flex>

        {inferenceStatus && (
          <Card
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: isProcessing ? "#E3F2FD" : inferenceStatus.includes("error") ? "#FFEBEE" : "#E8F5E9",
              border: "none",
            }}
          >
            <Flex justify="between" align="center">
              <Text size="2">
                {inferenceStatus}
              </Text>
              {txDigest && (
                <Button
                  variant="soft"
                  size="1"
                  style={{ background: "#FFF4F2", color: "#FF5733" }}
                  onClick={() => window.open(getSuiScanUrl('transaction', txDigest), '_blank')}
                >
                  <Text size="1">View on Sui Scan</Text>
                </Button>
              )}
            </Flex>
            {txDigest && (
              <Text size="1" style={{ marginTop: "4px", fontFamily: "monospace" }}>
                Transaction: {txDigest.substring(0, 10)}...
              </Text>
            )}
          </Card>
        )}

        {predictResults.length > 0 && (
          <Box style={{ marginTop: "16px" }}>
            <Heading size="3" mb="2">
              Layer-by-Layer Inference Results
            </Heading>
            
            <Flex direction="column" gap="3" mb="4">
              <Box>
                <Text size="2" mb="1" style={{ fontWeight: 600 }}>
                  Current Progress: {currentLayerIndex} / {getLayerCount()} Layers
                </Text>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#E0E0E0",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(currentLayerIndex / Math.max(1, getLayerCount())) * 100}%`,
                      height: "100%",
                      backgroundColor: "#FF5733",
                      transition: "width 0.3s ease-in-out",
                    }}
                  />
                </div>
              </Box>
              
              <Card style={{ padding: "10px", background: "#F5F5F5" }}>
                <Flex align="center" justify="between">
                  <Text size="2" style={{ fontWeight: 600 }}>
                    Total Layers: {getLayerCount()}
                  </Text>
                  <Text size="2" style={{ fontWeight: 600 }}>
                    Prediction Results: {predictResults.length}
                  </Text>
                </Flex>
              </Card>
            </Flex>
            
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Layer</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Activation Function</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Input Vector</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Output Vector</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {predictResults.map((result, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>
                      <Badge color="orange" mr="1">{result.layerIdx + 1}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {getActivationTypeName(result.activationType)}
                    </Table.Cell>
                    <Table.Cell>
                      <Box style={{ maxWidth: "200px", overflow: "hidden" }}>
                        <Flex direction="column" gap="1">
                          <Text size="1" style={{ color: "var(--gray-9)" }}>
                            Size: {result.inputMagnitude.length}
                          </Text>
                          <Code
                            style={{
                              maxHeight: "60px",
                              overflow: "auto",
                              fontSize: "11px",
                              padding: "4px",
                              backgroundColor: "var(--gray-a2)",
                            }}
                          >
                            [{formatVector(result.inputMagnitude, result.inputSign)}]
                          </Code>
                        </Flex>
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box style={{ maxWidth: "200px", overflow: "hidden" }}>
                        <Flex direction="column" gap="1">
                          <Text size="1" style={{ color: "var(--gray-9)" }}>
                            Size: {result.outputMagnitude.length}
                          </Text>
                          <Code
                            style={{
                              maxHeight: "60px",
                              overflow: "auto",
                              fontSize: "11px",
                              padding: "4px",
                              backgroundColor: "var(--gray-a2)",
                            }}
                          >
                            [{formatVector(result.outputMagnitude, result.outputSign)}]
                          </Code>
                        </Flex>
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      {result.argmaxIdx !== undefined ? (
                        <Flex direction="column" gap="2">
                          <Badge color="orange">
                            Final Prediction Value: {formatVector([result.outputMagnitude[result.argmaxIdx]], [result.outputSign[result.argmaxIdx]])}
                          </Badge>
                          {result.txDigest && (
                            <Button
                              size="1"
                              variant="soft"
                              style={{ background: "#FFF4F2", color: "#FF5733" }}
                              onClick={() => result.txDigest && window.open(getSuiScanUrl('transaction', result.txDigest), '_blank')}
                            >
                              View Transaction
                            </Button>
                          )}
                        </Flex>
                      ) : (
                        <Badge color="orange">Completed</Badge>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
                
                {/* Currently processing layer row */}
                {isProcessing && (
                  <Table.Row>
                    <Table.Cell>
                      <Badge color="orange" mr="1">{currentLayerIndex + 1}</Badge>
                    </Table.Cell>
                    <Table.Cell>In Progress...</Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <ReloadIcon style={{ animation: "spin 1s linear infinite" }} />
                        <Text size="2">Processing...</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <ReloadIcon style={{ animation: "spin 1s linear infinite" }} />
                        <Text size="2">Processing...</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="orange">Processing</Badge>
                    </Table.Cell>
                  </Table.Row>
                )}
                
                {/* Remaining layers rows */}
                {Array.from({ length: Math.max(0, getLayerCount() - currentLayerIndex - (isProcessing ? 1 : 0)) }).map((_, idx) => (
                  <Table.Row key={`pending-${idx}`} style={{ opacity: 0.5 }}>
                    <Table.Cell>
                      <Badge variant="outline" mr="1">{currentLayerIndex + idx + (isProcessing ? 1 : 0) + 1}</Badge>
                    </Table.Cell>
                    <Table.Cell>Pending</Table.Cell>
                    <Table.Cell>-</Table.Cell>
                    <Table.Cell>-</Table.Cell>
                    <Table.Cell>
                      <Badge variant="outline" color="gray">Pending</Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Flex>
    </Card>
  );
}

// 추론 결과 테이블 컴포넌트
interface InferenceResultTableProps {
  predictResults: any[];
  currentLayerIndex: number;
  isProcessing: boolean;
  layerCount: number;
}

function InferenceResultTable({ 
  predictResults, 
  currentLayerIndex, 
  isProcessing, 
  layerCount 
}: InferenceResultTableProps) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Layer</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Activation Function</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Input Vector</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Output Vector</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {predictResults.map((result, index) => (
          <Table.Row key={index}>
            <Table.Cell>
              <Badge color="orange" mr="1">{result.layerIdx + 1}</Badge>
            </Table.Cell>
            <Table.Cell>
              {getActivationTypeName(result.activationType)}
            </Table.Cell>
            <Table.Cell>
              <Box style={{ maxWidth: "200px", overflow: "hidden" }}>
                <Flex direction="column" gap="1">
                  <Text size="1" style={{ color: "var(--gray-9)" }}>
                    Size: {result.inputMagnitude.length}
                  </Text>
                  <Code
                    style={{
                      maxHeight: "60px",
                      overflow: "auto",
                      fontSize: "11px",
                      padding: "4px",
                      backgroundColor: "var(--gray-a2)",
                    }}
                  >
                    [{formatVector(result.inputMagnitude, result.inputSign)}]
                  </Code>
                </Flex>
              </Box>
            </Table.Cell>
            <Table.Cell>
              <Box style={{ maxWidth: "200px", overflow: "hidden" }}>
                <Flex direction="column" gap="1">
                  <Text size="1" style={{ color: "var(--gray-9)" }}>
                    Size: {result.outputMagnitude.length}
                  </Text>
                  <Code
                    style={{
                      maxHeight: "60px",
                      overflow: "auto",
                      fontSize: "11px",
                      padding: "4px",
                      backgroundColor: "var(--gray-a2)",
                    }}
                  >
                    [{formatVector(result.outputMagnitude, result.outputSign)}]
                  </Code>
                </Flex>
              </Box>
            </Table.Cell>
            <Table.Cell>
              {result.argmaxIdx !== undefined ? (
                <Badge color="orange">
                  Final Prediction Value: {formatVector([result.outputMagnitude[result.argmaxIdx]], [result.outputSign[result.argmaxIdx]])}
                </Badge>
              ) : (
                <Badge color="orange">Completed</Badge>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
        
        {/* Currently processing layer row */}
        {isProcessing && (
          <Table.Row>
            <Table.Cell>
              <Badge color="orange" mr="1">{currentLayerIndex + 1}</Badge>
            </Table.Cell>
            <Table.Cell>In Progress...</Table.Cell>
            <Table.Cell>
              <Flex align="center" gap="2">
                <ReloadIcon style={{ animation: "spin 1s linear infinite" }} />
                <Text size="2">Processing...</Text>
              </Flex>
            </Table.Cell>
            <Table.Cell>
              <Flex align="center" gap="2">
                <ReloadIcon style={{ animation: "spin 1s linear infinite" }} />
                <Text size="2">Processing...</Text>
              </Flex>
            </Table.Cell>
            <Table.Cell>
              <Badge color="orange">Processing</Badge>
            </Table.Cell>
          </Table.Row>
        )}
        
        {/* Remaining layers rows */}
        {Array.from({ length: Math.max(0, layerCount - currentLayerIndex - (isProcessing ? 1 : 0)) }).map((_, idx) => (
          <Table.Row key={`pending-${idx}`} style={{ opacity: 0.5 }}>
            <Table.Cell>
              <Badge variant="outline" mr="1">{currentLayerIndex + idx + (isProcessing ? 1 : 0) + 1}</Badge>
            </Table.Cell>
            <Table.Cell>Pending</Table.Cell>
            <Table.Cell>-</Table.Cell>
            <Table.Cell>-</Table.Cell>
            <Table.Cell>
              <Badge variant="outline" color="gray">Pending</Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
} 