import * as cdk from '@aws-cdk/core';
import * as appmesh from '@aws-cdk/aws-appmesh';
import { IService } from '@aws-cdk/aws-servicediscovery';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  mesh: appmesh.IMesh;
  nodes: { name: string, service: IService, vNodeListeners: appmesh.VirtualNodeListener[], weight: number }[];
}
interface IVirtualNode {
  readonly weightedTargets: appmesh.WeightedTarget[];
  createResources(props: Props): void;
}
export class VirtualNode extends Resource implements IVirtualNode {
  public weightedTargets: appmesh.WeightedTarget[] = [];
  public createResources(props: Props): void {
    props.nodes.forEach(data => {
      const node = props.mesh.addVirtualNode(`${props.projectName}VirtualNode${data.name}`, {
        virtualNodeName: data.name,
        serviceDiscovery: appmesh.ServiceDiscovery.cloudMap(data.service),
        listeners: data.vNodeListeners,
        accessLog: appmesh.AccessLog.fromFilePath('/dev/stdout'),
      });
      this.weightedTargets.push({ virtualNode: node, weight: data.weight });
    });
  }
}
