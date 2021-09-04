import * as appmesh from '@aws-cdk/aws-appmesh';
import { IService } from '@aws-cdk/aws-servicediscovery';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  mesh: appmesh.IMesh;
  nodes: { name: string, service?: IService, vNodeListeners: appmesh.VirtualNodeListener[], weight: number, backends?: string[] }[];
}
interface IVirtualNode {
  readonly weightedTargets: appmesh.WeightedTarget[];
  createResources(props: Props): void;
}
export class VirtualNode extends Resource implements IVirtualNode {
  public weightedTargets: appmesh.WeightedTarget[] = [];
  public createResources(props: Props): void {
    props.nodes.forEach(data => {
      const node = props.mesh.addVirtualNode(`VirtualNode-${data.name}`, {
        virtualNodeName: data.name,
        serviceDiscovery: data.service? appmesh.ServiceDiscovery.cloudMap(data.service) : undefined,
        listeners: data.vNodeListeners,
        accessLog: appmesh.AccessLog.fromFilePath('/dev/stdout'),
      });
      (data.backends || []).forEach(backend => {
        node.addBackend(appmesh.Backend.virtualService(appmesh.VirtualService.fromVirtualServiceArn(this.scope, `VirtualBackEnd-${data.name}`, backend)));
      });
      this.weightedTargets.push({ virtualNode: node, weight: data.weight });
    });
  }
}
