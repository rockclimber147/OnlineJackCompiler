import { type ASTNode } from './AST';

export abstract class VisitorBase<T> {
  public abstract visit(node: ASTNode): T;
  protected visitMany(nodes: ASTNode[] | undefined): T[] {
    if (!nodes) return [];
    return nodes.map((node) => this.visit(node));
  }
}
