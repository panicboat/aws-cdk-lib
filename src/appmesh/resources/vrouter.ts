import * as appmesh from '@aws-cdk/aws-appmesh';
import { Resource } from '../resource';

interface IVirtualRouter {
  createRouter(props: { projectName: string, mesh: appmesh.IMesh, listeners: appmesh.VirtualRouterListener[] }): appmesh.IVirtualRouter;
  addGrpcRoute(props: { router: appmesh.VirtualRouter, routes: { name: string, match: appmesh.GrpcRouteMatch }[], targets: appmesh.WeightedTarget[] }): void;
  addHttpRoute(props: { router: appmesh.VirtualRouter, routes: { name: string, match: appmesh.HttpRouteMatch }[], targets: appmesh.WeightedTarget[] }): void;
  addHttp2Route(props: { router: appmesh.VirtualRouter, routes: { name: string, match: appmesh.HttpRouteMatch }[], targets: appmesh.WeightedTarget[] }): void;
  addTcpRoute(props: { router: appmesh.VirtualRouter, routes: { name: string, match: appmesh.HttpRouteMatch }[], targets: appmesh.WeightedTarget[] }): void;
}
export class VirtualRouter extends Resource implements IVirtualRouter {

  public createRouter(props: { projectName: string, mesh: appmesh.IMesh, listeners: appmesh.VirtualRouterListener[] }) {
    const router = props.mesh.addVirtualRouter(`VirtualRouter-${props.projectName}`, {
      listeners: props.listeners,
      virtualRouterName: props.projectName
    });
    return router;
  }

  public addGrpcRoute(props: { router: appmesh.VirtualRouter, routes: { name: string, match: appmesh.GrpcRouteMatch }[], targets: appmesh.WeightedTarget[] }) {
    props.routes.forEach(route => {
      props.router.addRoute(`GrpcRoute-${route.name}`, {
        routeName: route.name,
        routeSpec: appmesh.RouteSpec.grpc({
          weightedTargets: props.targets,
          match: route.match
        })
      });
    });
  }

  public addHttpRoute(props: { router: appmesh.VirtualRouter, routes: { name: string, match: appmesh.HttpRouteMatch }[], targets: appmesh.WeightedTarget[] }) {
    props.routes.forEach(route => {
      props.router.addRoute(`HttpRoute-${route.name}`, {
        routeName: route.name,
        routeSpec: appmesh.RouteSpec.http({
          weightedTargets: props.targets,
          match: route.match
        })
      });
    });
  }

  public addHttp2Route(props: { router: appmesh.VirtualRouter, routes: { name: string, match: appmesh.HttpRouteMatch }[], targets: appmesh.WeightedTarget[] }) {
    props.routes.forEach(route => {
      props.router.addRoute(`Http2Route-${route.name}`, {
        routeName: route.name,
        routeSpec: appmesh.RouteSpec.http2({
          weightedTargets: props.targets,
          match: route.match
        })
      });
    });
  }

  public addTcpRoute(props: { router: appmesh.VirtualRouter, routes: { name: string }[], targets: appmesh.WeightedTarget[] }) {
    props.routes.forEach(route => {
      props.router.addRoute(`TcpRoute-${route.name}`, {
        routeName: route.name,
        routeSpec: appmesh.RouteSpec.tcp({
          weightedTargets: props.targets,
        })
      });
    });
  }
}
