import * as appmesh from '@aws-cdk/aws-appmesh';
import { IService } from '@aws-cdk/aws-servicediscovery';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  mesh: appmesh.IMesh;
  nodes: { name: string, service?: IService, vNodeListeners: appmesh.VirtualNodeListener[], weight: number, backends?: string[] }[];
}
interface IVirtualNode {
  createNode(props: { mesh: appmesh.IMesh, nodes: { name: string, service?: IService, listeners: appmesh.VirtualNodeListener[], weight: number, backends?: string[] }[] }): appmesh.WeightedTarget[];
}
export class VirtualNode extends Resource implements IVirtualNode {

  public createNode(props: { mesh: appmesh.IMesh, nodes: { name: string, service?: IService, listeners: appmesh.VirtualNodeListener[], weight: number, backends?: string[] }[] }) {
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
