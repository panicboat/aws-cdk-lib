import { IMesh, VirtualRouterListener, GrpcRouteMatch, HttpRouteMatch, VirtualNodeListener, IVirtualRouter, VirtualRouter, WeightedTarget } from '@aws-cdk/aws-appmesh';
import { IService } from '@aws-cdk/aws-servicediscovery';

export interface Props {
  projectName: string
  serviceName: string
  mesh: IMesh
  listeners: VirtualRouterListener[]
  route: {
    grpc?: { name: string, match: GrpcRouteMatch }[]
    http?: { name: string, match: HttpRouteMatch }[]
    http2?: { name: string, match: HttpRouteMatch }[]
    tcp?: { name: string }[]
  }
  nodes: {
    name: string
    service?: IService
    listeners: VirtualNodeListener[]
    weight: number
    backends?: string[]
  }[]
}

export interface VirtualServiceProps {
  projectName: string
  serviceName: string
  router: IVirtualRouter
}

export interface VirtualRouterProps {
  projectName: string
  mesh: IMesh
  listeners: VirtualRouterListener[]
}

export interface GrpcRouteProps {
  router: VirtualRouter
  routes: {
    name: string
    match: GrpcRouteMatch
  }[]
  targets: WeightedTarget[]
}

export interface HttpRouteProps {
  router: VirtualRouter
  routes: {
    name: string
    match: HttpRouteMatch
  }[]
  targets: WeightedTarget[]
}

export interface Http2RouteProps {
  router: VirtualRouter
  routes: {
    name: string
    match: HttpRouteMatch
  }[]
  targets: WeightedTarget[]
}

export interface TcpRouteProps {
  router: VirtualRouter
  routes: {
    name: string
  }[]
  targets: WeightedTarget[]
}

export interface VirtualNodeProps {
  mesh: IMesh
  nodes: {
    name: string
    service?: IService
    listeners: VirtualNodeListener[]
    weight: number
    backends?: string[]
  }[]
}
