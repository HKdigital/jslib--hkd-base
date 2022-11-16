
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

  const rootId = root[ idKey ];

  expectNotEmptyString( rootId,
    `Invalid property [ root[${idKey}] ] in branchGraphData` );

  root = { ...root };

  expectObject( root,
    "Invalid property [root] in branchGraphData" );

  // -- Build graph

  const nodesByFrom = { [rootId]: root };

  const allNodeIds = new Set();

  allNodeIds.add( rootId );

  const todo = [];

  for( const branch of branches )
  {
    const { from, node } = branch;

    expectNotEmptyString( from,
      "Invalid property [branch.from] in branchGraphData" );

    expectObject( node,
      "Invalid property [branch.node] in branchGraphData" );

    const nodeId = node[ idKey ];

    expectNotEmptyString( nodeId,
      `Invalid property [ branch.node[${idKey}] ] in branchGraphData` );

    allNodeIds.add( nodeId );

    todo.push( branch );
  } // end for

  while( todo.length )
  {
    let { from, node } = todo.shift();

    if( !allNodeIds.has( from ) )
    {
      throw new Error(`Invalid branch node [from=${from}] was not found`);
    }

    const fromNode = nodesByFrom[ from ];

    if( !fromNode )
    {
      // fromNode has not been set yet (but we know it exists) -> process later
      todo.push( fromNode );
      continue;
    }

    const nodeId = node[ idKey ];

    if( !nodesByFrom[ nodeId ] )
    {
      //
      // Shallow clone node and store
      //
      node =
        nodesByFrom[ nodeId ] = { ...node };
    }
    else {
      //
      // Use (shallow cloned) node from `nodesByFrom`
      //
      node = nodesByFrom[ nodeId ];
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

    if( !fromNode[ subGroupName ] )
    {
      fromNode[ subGroupName ] = [ node ];
    }
    else {
      fromNode[ subGroupName ].push( node );
    }

  } // end for

  // console.log( 123,
  //   branches,
  //   root );

  return root;
}