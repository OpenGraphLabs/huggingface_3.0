import { SUI_NETWORK, SUI_CONTRACT } from "../constants/suiConfig";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { WALRUS_AGGREGATOR_URL } from "./walrusService";

/**
 * 모델 객체 인터페이스
 */
export interface ModelObject {
  id: string;
  name: string;
  description: string;
  task_type: string;
  graphs: GraphObject[];
  partial_denses: PartialDenseObject[];
  scale: string | number;
  // UI에 필요한 추가 필드
  creator: string;
  downloads: number;
  likes: number;
  createdAt: string;
  frameworks: string[];
}

export interface GraphObject {
  id?: string;
  layers: Layer[];
}

export interface Layer {
  layer_type: number;
  in_dimension: string | number;
  out_dimension: string | number;
  weight_tensor: Tensor;
  bias_tensor: Tensor;
}

export interface Tensor {
  shape: (string | number)[];
  magnitude: (string | number)[];
  sign: (string | number)[];
  scale: string | number;
}

export interface PartialDenseObject {
  id?: string;
  partials: PartialDense[];
}

export interface PartialDense {
  accum_mag: (string | number)[];
  accum_sign: (string | number)[];
  out_dim: string | number;
  in_dim: string | number;
  scale: string | number;
}

export interface BlobObject {
  id: string;
  owner: string;
  type: string;
  createdAt: string;
  size: number;
  mediaUrl: string;
}

/**
 * 모델 GraphQL 서비스
 */
export class ModelGraphQLService {
  private gqlClient: SuiGraphQLClient;

  constructor() {
    this.gqlClient = new SuiGraphQLClient({
      url: SUI_NETWORK.GRAPHQL_URL,
    });
  }

  /**
   * 모든 모델 객체 가져오기
   */
  async getAllModels(): Promise<ModelObject[]> {
    try {
      const query = graphql(`
        query GetModels {
          objects(filter: {
            type: "${SUI_CONTRACT.PACKAGE_ID}::model::Model"
          }) {
            nodes {
              address
              version
              owner{
                ... on AddressOwner {
                  owner {
                    address
                  }
                }
              }
              asMoveObject {
                contents {
                  json
                }
              }
            }
          }
        }
      `);

      const result = await this.gqlClient.query({
        query: query,
      });

      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
      }

      console.log("graphQL data: \n", result.data);

      const objectNodes = result.data?.objects?.nodes || [];
      return this.transformModelNodes(objectNodes as any[]);
    } catch (error) {
      console.error("Error fetching models:", error);
      throw error;
    }
  }

  /**
   * 특정 ID의 모델 객체 가져오기
   */
  async getModelById(modelId: string): Promise<ModelObject | null> {
    try {
      const query = graphql(`
        query GetModel {
          object(address: "${modelId}") {
            address
            version
            owner{
              ... on AddressOwner {
                owner {
                  address
                }
              }
            }
            asMoveObject {
              contents {
                json
              }
            }
          }
        }
      `);

      const result = await this.gqlClient.query({
        query: query,
      });

      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
      }

      console.log("graphQL data: \n", result.data);

      // 객체가 없는 경우
      if (!result.data?.object) {
        return null;
      }

      // 단일 모델을 변환
      const models = this.transformModelNodes([result.data.object as any]);
      return models.length > 0 ? models[0] : null;
    } catch (error) {
      console.error(`Error fetching model with ID ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * GraphQL 응답 노드를 ModelObject 배열로 변환
   */
  private transformModelNodes(nodes: any[]): ModelObject[] {
    return nodes.map(node => {
      // JSON 데이터 추출
      const jsonData = node?.asMoveObject?.contents?.json;
      console.log("JSON 데이터:", jsonData);

      // 모델 생성일
      const createdDate = new Date(node.createdAt || Date.now());

      // 소유자 주소 처리
      let ownerAddress = "Unknown";
      if (node.owner && node.owner.owner && node.owner.owner.address) {
        ownerAddress = node.owner.owner.address.toString();
      }

      if (!jsonData) {
        console.warn(`No JSON data found for model with ID ${node.address}`);
      }

      // 기본값 설정
      const defaultData = {
        id: node.address,
        name: `Model ${node.address.substring(0, 8)}`,
        description: "모델에 대한 설명이 제공되지 않았습니다.",
        task_type: "text-generation",
        graphs: [],
        partial_denses: [],
        scale: 0,
        creator: ownerAddress,
        downloads: Math.floor(Math.random() * 1000), // 임시 데이터
        likes: Math.floor(Math.random() * 500), // 임시 데이터
        createdAt: createdDate.toISOString(),
        frameworks: ["SUI", "OpenGraph"],
      };

      // JSON 데이터가 있으면 해당 데이터 사용
      if (jsonData) {
        return {
          ...defaultData,
          name: jsonData.name || defaultData.name,
          description: jsonData.description || defaultData.description,
          task_type: jsonData.task_type || defaultData.task_type,
          graphs: jsonData.graphs || defaultData.graphs,
          partial_denses: jsonData.partial_denses || defaultData.partial_denses,
          scale: jsonData.scale || defaultData.scale,
        };
      }

      return defaultData;
    });
  }

  /**
   * Get all Blob objects owned by the current user
   */
  async getUserBlobs(userAddress: string): Promise<BlobObject[]> {
    try {
      const query = graphql(`
        query GetUserBlobs {
          objects(filter: {
            type: "0x795ddbc26b8cfff2551f45e198b87fc19473f2df50f995376b924ac80e56f88b::blob::Blob",
            owner: "${userAddress}"
          }) {
            nodes {
              address
              version
              owner {
                ... on AddressOwner {
                  owner {
                    address
                  }
                }
              }
              asMoveObject {
                contents {
                  json
                }
              }
            }
          }
        }
      `);

      const result = await this.gqlClient.query({
        query: query,
      });

      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
      }

      const objectNodes = result.data?.objects?.nodes || [];
      return this.transformBlobNodes(objectNodes as any[]);
    } catch (error) {
      console.error("Error fetching user blobs:", error);
      throw error;
    }
  }

  /**
   * Transform GraphQL response nodes to BlobObject array
   */
  private transformBlobNodes(nodes: any[]): BlobObject[] {
    return nodes.map(node => {
      const jsonData = node?.asMoveObject?.contents?.json;
      const ownerAddress = node.owner?.owner?.address || "Unknown";
      const createdAt = new Date(node.createdAt || Date.now());

      return {
        id: node.address,
        owner: ownerAddress,
        type: node.type,
        createdAt: createdAt.toISOString(),
        size: jsonData?.size || 0,
        mediaUrl: `${WALRUS_AGGREGATOR_URL}/v1/blobs/by-object-id/${node.address}`,
      };
    });
  }
}

// 싱글톤 인스턴스 생성
export const modelGraphQLService = new ModelGraphQLService();
