
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectObject } from "./expect.js";

/* ------------------------------------------------------------------ Exports */

/**
 * Build a tree from flat tree data format, consisting of a root node
 * and branches (edge-vertex pairs)
 *
 * @param {object} branchGraphData - tree: { root, branches }
 *
 * @returns {object} tree data
 */
export function buildTreeFromBranches( branchGraphData, idKey="_id" )
{
  expectObject( branchGraphData,
    "Missing or invalid parameter [branchGraphData]" );

  let { root, branches } = branchGraphData;

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
    `Invalid property [ root[${idKey}] ] in branchGraphData` );

  root = { ...root };

  expectObject( root,
    "Invalid property [root] in branchGraphData" );

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
        "Invalid property [branch.from] in branchGraphData" );
    }
    else if( to )
    {
      expectNotEmptyString( to,
        "Invalid property [branch.to] in branchGraphData" );
    }
    else {
      throw new Error(
        `Missing property [branch.from] or [branch.to] in branchGraphData`);
    }

    // expectObject( node,
    //   "Invalid property [branch.node] in branchGraphData" );

    if( !node )
    {
      // Ignore branch with missing node property
      // (a link as found, but node is missing)
      continue;
    }

    const nodeId = node[ idKey ];

    expectNotEmptyString( nodeId,
      `Invalid property [ branch.node[${idKey}] ] in branchGraphData` );

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