
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectObject } from "./expect.js";

/* ------------------------------------------------------------------ Exports */

/**
 * Build a tree from flat tree data format, consisting of a root node
 * and branches (edge-vertex pairs)
 *
 * @param {{ root: object[], branches: object[] }} flatTree - Flat tree data
 *
 * @returns {object} tree data
 */
export function buildTree( flatTree, idKey="_id" )
{
  expectObject( flatTree,
    "Missing or invalid parameter [flatTree]" );

  let { root, branches } = flatTree;

  if( !root )
  {
    if( branches && branches.length )
    {
      throw new Error(
        `Invalid tree data. Missing property [root], ` +
        `but property [branches] is not empty`);
    }

    return null;
  }

  if( !branches || !branches.length )
  {
    return root;
  }

  const rootId = root[ idKey ];

  expectNotEmptyString( rootId,
    `Invalid property [ root[${idKey}] ] in flatTree` );

  root = { ...root };

  expectObject( root,
    "Invalid property [root] in flatTree" );

  // -- Build graph

  const nodesByFromOrTo = { [rootId]: root };

  const allNodeIds = new Set();

  allNodeIds.add( rootId );

  const todo = [];

  for( const branch of branches )
  {
    const { from, to, node } = branch;

    if( from )
    {
      expectNotEmptyString( from,
        "Invalid property [branch.from] in flatTree" );
    }
    else if( to )
    {
      expectNotEmptyString( to,
        "Invalid property [branch.to] in flatTree" );
    }
    else {
      throw new Error(
        `Missing property [branch.from] or [branch.to] in flatTree`);
    }

    // expectObject( node,
    //   "Invalid property [branch.node] in flatTree" );

    if( !node )
    {
      // Ignore branch with missing node property
      // (a link as found, but node is missing)
      continue;
    }

    const nodeId = node[ idKey ];

    expectNotEmptyString( nodeId,
      `Invalid property [ branch.node[${idKey}] ] in flatTree` );

    allNodeIds.add( nodeId );

    todo.push( branch );
  } // end for

  while( todo.length )
  {
    let { from, to, node } = todo.shift();

    let fromOrTo;

    if( from )
    {
      if( !allNodeIds.has( from ) )
      {
        throw new Error(`Invalid branch node [from=${from}] was not found`);
      }

      fromOrTo = from;
    }
    else {
      if( !allNodeIds.has( to ) )
      {
        throw new Error(`Invalid branch node [to=${to}] was not found`);
      }

      fromOrTo = to;
    }

    const fromOrToNode = nodesByFromOrTo[ fromOrTo ];

    if( !fromOrToNode )
    {
      //
      // fromOrToNode has not been set yet (but we know it exists)
      // => process later
      //
      todo.push( fromOrToNode );
      continue;
    }

    const nodeId = node[ idKey ];

    if( !nodesByFromOrTo[ nodeId ] )
    {
      //
      // Shallow clone node and store
      //
      node =
        nodesByFromOrTo[ nodeId ] = { ...node };
    }
    else {
      //
      // Use (shallow cloned) node from `nodesByFromOrTo`
      //
      node = nodesByFromOrTo[ nodeId ];
    }

    const x = nodeId.indexOf("/");

    let subGroupName;

    if( x > 0 )
    {
      subGroupName = nodeId.slice( 0, x );
    }
    else {
      subGroupName = "_next";
    }

    if( !fromOrToNode[ subGroupName ] )
    {
      fromOrToNode[ subGroupName ] = [ node ];
    }
    else {
      fromOrToNode[ subGroupName ].push( node );
    }

  } // end for

  // console.log( 123,
  //   branches,
  //   root );

  return root;
}