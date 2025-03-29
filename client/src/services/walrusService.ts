// Walrus 스토리지 연동을 위한 서비스

import { getSuiScanUrl } from "../utils/sui";

// Walrus 네트워크 설정
const WALRUS_NETWORK = "testnet"; // 또는 "devnet", "mainnet" 등
const WALRUS_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";
const SUI_VIEW_TX_URL = `https://suiscan.xyz/${WALRUS_NETWORK}/tx`;
const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/${WALRUS_NETWORK}/object`;

// 저장 상태 enum
export enum WalrusStorageStatus {
  ALREADY_CERTIFIED = "Already certified",
  NEWLY_CREATED = "Newly created",
  UNKNOWN = "Unknown"
}

// 저장 정보 인터페이스
export interface WalrusStorageInfo {
  blobId: string;
  endEpoch: number;
  status: WalrusStorageStatus;
  suiRef: string;
  suiRefType: string;
  mediaUrl: string;
  suiScanUrl: string;  // SuiScan URL (transaction or object)
  suiRefId: string;    // Original ID (either transaction digest or object ID)
}

/**
 * 이미지/영상 업로드 함수
 * @param file 업로드할 파일
 * @param sendTo 소유권을 가질 주소 
 * @param epochs 저장할 에포크 수 (선택적)
 * @returns 저장 정보
 */
export async function uploadMedia(
  file: File, 
  sendTo: string,
  epochs?: number,
): Promise<WalrusStorageInfo> {
  try {
    console.log("File to upload:", file);

    // 쿼리 파라미터 구성
    let epochsParam = epochs ? `&epochs=${epochs}` : "";
    const url = `${WALRUS_PUBLISHER_URL}/v1/blobs?send_object_to=${sendTo}${epochsParam}`;
    console.log("Walrus 업로드 URL:", url);
    
    // PUT 요청으로 파일 업로드
    const response = await fetch(url, {
      method: "PUT",
      body: file,
    });
    
    if (!response.ok) {
      throw new Error(`업로드 실패: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Walrus 업로드 응답:", data);
    
    // 응답 데이터 처리
    let storageInfo: WalrusStorageInfo;
    
    if ("alreadyCertified" in data) {
      storageInfo = {
        status: WalrusStorageStatus.ALREADY_CERTIFIED,
        blobId: data.alreadyCertified.blobId,
        endEpoch: data.alreadyCertified.endEpoch,
        suiRefType: "Previous Sui Certified Event",
        suiRef: data.alreadyCertified.event.txDigest,
        mediaUrl: `${WALRUS_AGGREGATOR_URL}/v1/blobs/${data.alreadyCertified.blobId}`,
        suiScanUrl: getSuiScanUrl('transaction', data.alreadyCertified.event.txDigest),
        suiRefId: data.alreadyCertified.event.txDigest
      };
      console.log("[기존 BLOB 객체 업데이트] 관련 Tx digest:", data.alreadyCertified.event.txDigest);
    } else if ("newlyCreated" in data) {
      storageInfo = {
        status: WalrusStorageStatus.NEWLY_CREATED,
        blobId: data.newlyCreated.blobObject.blobId,
        endEpoch: data.newlyCreated.blobObject.storage.endEpoch,
        suiRefType: "Associated Sui Object",
        suiRef: data.newlyCreated.blobObject.id,
        mediaUrl: `${WALRUS_AGGREGATOR_URL}/v1/blobs/${data.newlyCreated.blobObject.blobId}`,
        suiScanUrl: getSuiScanUrl('object', data.newlyCreated.blobObject.id),
        suiRefId: data.newlyCreated.blobObject.id
      };
      console.log("[신규 BLOB 객체 생성] BLOB 객체 ID:", data.newlyCreated.blobObject.id);
    } else {
      throw new Error("알 수 없는 응답 형식");
    }
    
    return storageInfo;
  } catch (error) {
    console.error('미디어 업로드 오류:', error);
    throw error;
  }
}

/**
 * 미디어 가져오기 함수
 * @param blobId Walrus Blob ID
 * @returns Blob 객체
 */
export async function getMedia(blobId: string): Promise<Blob> {
  try {
    const url = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`미디어 가져오기 실패: ${response.status} ${response.statusText}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('미디어 가져오기 오류:', error);
    throw error;
  }
}

/**
 * Blob ID에서 미디어 URL 생성
 * @param blobId Walrus Blob ID
 * @returns 미디어 URL
 */
export function getMediaUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
}

/**
 * Sui 객체 또는 트랜잭션 URL 생성
 * @param suiRef Sui 참조 (객체 ID 또는 트랜잭션 다이제스트)
 * @param type 참조 유형 ('object' 또는 'tx')
 * @returns Sui 탐색기 URL
 */
export function getSuiExplorerUrl(suiRef: string, type: 'object' | 'tx'): string {
  const baseUrl = type === 'object' ? SUI_VIEW_OBJECT_URL : SUI_VIEW_TX_URL;
  return `${baseUrl}/${suiRef}`;
}

/**
 * 학습 데이터 업로드 함수
 * @param files 업로드할 파일 배열
 * @param sendTo 소유권을 가질 주소 
 * @param epochs 저장할 에포크 수 (선택적)
 * @returns 저장 정보 배열
 */
export async function uploadTrainingData(
  files: File[],
  sendTo: string,
  epochs?: number,
): Promise<WalrusStorageInfo[]> {
  const results: WalrusStorageInfo[] = [];

  for (const file of files) {
    try {
      const url = `${WALRUS_PUBLISHER_URL}/v1/blobs?send_object_to=${sendTo}${epochs ? `&epochs=${epochs}` : ""}`;
      console.log("Uploading to URL:", url);

      const response = await fetch(url, {
        method: "PUT",
        body: file,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed with status:", response.status);
        console.error("Error response:", errorText);
        throw new Error(`Failed to upload file: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      console.log("Upload response:", data);
      
      // Handle response data similar to uploadMedia function
      let storageInfo: WalrusStorageInfo;
      
      if ("alreadyCertified" in data) {
        storageInfo = {
          status: WalrusStorageStatus.ALREADY_CERTIFIED,
          blobId: data.alreadyCertified.blobId,
          endEpoch: data.alreadyCertified.endEpoch,
          suiRefType: "Previous Sui Certified Event",
          suiRef: data.alreadyCertified.event.txDigest,
          mediaUrl: `${WALRUS_AGGREGATOR_URL}/v1/blobs/${data.alreadyCertified.blobId}`,
          suiScanUrl: getSuiScanUrl('transaction', data.alreadyCertified.event.txDigest),
          suiRefId: data.alreadyCertified.event.txDigest
        };
        console.log("[기존 BLOB 객체 업데이트] 관련 Tx digest:", data.alreadyCertified.event.txDigest);
      } else if ("newlyCreated" in data) {
        storageInfo = {
          status: WalrusStorageStatus.NEWLY_CREATED,
          blobId: data.newlyCreated.blobObject.blobId,
          endEpoch: data.newlyCreated.blobObject.storage.endEpoch,
          suiRefType: "Associated Sui Object",
          suiRef: data.newlyCreated.blobObject.id,
          mediaUrl: `${WALRUS_AGGREGATOR_URL}/v1/blobs/${data.newlyCreated.blobObject.blobId}`,
          suiScanUrl: getSuiScanUrl('object', data.newlyCreated.blobObject.id),
          suiRefId: data.newlyCreated.blobObject.id
        };
        console.log("[신규 BLOB 객체 생성] BLOB 객체 ID:", data.newlyCreated.blobObject.id);
      } else {
        throw new Error("알 수 없는 응답 형식");
      }
      
      results.push(storageInfo);
    } catch (error) {
      console.error("Error uploading file:", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Failed to connect to Walrus API. Please check your internet connection and try again.");
      }
      throw error;
    }
  }

  return results;
}

/**
 * 학습 데이터 가져오기 함수
 * @param blobIds Walrus Blob ID 배열
 * @returns Blob 객체 배열
 */
export async function getTrainingData(blobIds: string[]): Promise<Blob[]> {
  try {
    const getPromises = blobIds.map(async (blobId) => {
      return await getMedia(blobId);
    });

    const results = await Promise.all(getPromises);
    return results;
  } catch (error) {
    console.error('학습 데이터 가져오기 오류:', error);
    throw error;
  }
} 