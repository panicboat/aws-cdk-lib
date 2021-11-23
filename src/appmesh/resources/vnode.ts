import * as appmesh from '@aws-cdk/aws-appmesh';
import { VirtualNodeProps } from '../props';
import { Resource } from '../resource';

interface IVirtualNode {
  createNode(props: VirtualNodeProps): appmesh.WeightedTarget[];
}
export class VirtualNode extends Resource implements IVirtualNode {

  public createNode(props: VirtualNodeProps) {
    const targets: appmesh.WeightedTarget[] = [];
    props.nodes.forEach(data => {
      const node = props.mesh.addVirtualNode(`VirtualNode-${data.name}`, {
        virtualNodeName: data.name,
        serviceDiscovery: data.service? appmesh.ServiceDiscovery.cloudMap(data.service) : undefined,
        listeners: data.listeners,
        accessLog: appmesh.AccessLog.fromFilePath('/dev/stdout'),
      });
      (data.backends || []).forEach(backend => {
        node.addBackend(appmesh.Backend.virtualService(appmesh.VirtualService.fromVirtualServiceArn(this.scope, `VirtualBackEnd-${data.name}`, backend)));
      });
      targets.push({ virtualNode: node, weight: data.weight });
    });
    return targets;
  }
}
