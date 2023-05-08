import React from "react";

import { availableVersions } from "../config/version";

export interface TableItem {
  name: string;
  version: string;
  description: string;
  parameters: string;
}
export interface TableWithVersionsProps {
  tables: Array<TableItem>;
}

const TableWithVersions = ({ tables }: TableWithVersionsProps) => {
  const [version, setVersion] = React.useState(availableVersions[0]);
  return (
    <div>
      <select
        onChange={e => {
          setVersion(e.target.value);
        }}
      >
        {availableVersions.map(v => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Version</th>
            <th>Description</th>
            <th>Parameters</th>
          </tr>
        </thead>
        <tbody>
          {tables
            .filter(item => item.version === version)
            .map(table => (
              <tr key={table.name}>
                <td>{table.name}</td>
                <td>{table.version}</td>
                <td>{table.description}</td>
                <td>{table.parameters}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableWithVersions;
