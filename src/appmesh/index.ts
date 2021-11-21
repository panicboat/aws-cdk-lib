import * as cdk from '@aws-cdk/core';
import * as appmesh from '@aws-cdk/aws-appmesh';
import { IService } from '@aws-cdk/aws-servicediscovery';
import { VirtualRouter } from './resources/vrouter';
import { VirtualService } from './resources/vservice';
import { VirtualNode } from './resources/vnode';

interface Props {
  projectName: string;
  serviceName: string;
  mesh: appmesh.IMesh;
  listeners: appmesh.VirtualRouterListener[];
  route: {
    grpc?: { name: string, match: appmesh.GrpcRouteMatch }[];
    http?: { name: string, match: appmesh.HttpRouteMatch }[];
    http2?: { name: string, match: appmesh.HttpRouteMatch }[];
    tcp?: { name: string }[];
  }
  nodes: { name: string, service?: IService, listeners: appmesh.VirtualNodeListener[], weight: number, backends?: string[] }[];
}
interface IMeshResources {
}
export class MeshResources extends cdk.Construct implements IMeshResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    const vNode = new VirtualNode(this);
    const targets = vNode.createNode({ mesh: props.mesh, nodes: props.nodes });

    const vRouter = new VirtualRouter(this);
    const router = vRouter.createRouter({ projectName: props.projectName, mesh: props.mesh, listeners: props.listeners });
    vRouter.addGrpcRoute({ router: router, routes: (props.route.grpc || []), targets: targets });
    vRouter.addHttpRoute({ router: router, routes: (props.route.http || []), targets: targets });
    vRouter.addHttp2Route({ router: router, routes: (props.route.http2 || []), targets: targets });
    vRouter.addTcpRoute({ router: router, routes: (props.route.tcp || []), targets: targets });

    const service = new VirtualService(this);
    service.createService({ projectName: props.projectName, serviceName: props.serviceName, router: router });
  }
}
