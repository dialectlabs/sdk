export interface NameService {
  getSNSNameByPublicKey(publicKey: string): Promise<String>;
  getTwitterHandler(publicKey: string): Promise<String>;
}
