import React, { ChangeEvent, useEffect, useState, CSSProperties } from "react";
import { Attributes } from "graphology-types";

import { useRegisterEvents, useCamera, useSigma } from "@react-sigma/core";

type SearchLabelKeys = "text" | "placeholder";

/**
 * Properties for `SearchControl` component
 */
export interface SearchControlProps {
  /**
   * HTML id
   */
  id?: string;

  /**
   * HTML class
   */
  className?: string;

  /**
   * HTML CSS style
   */
  style?: CSSProperties;

  /**
   * Map of the labels we use in the component.
   * This is usefull for I18N
   */
  labels?: { [Key in SearchLabelKeys]?: string };

  onLocate?: (nodeId: string) => void;
}

/**
 * The `SearchControl` create an input text where user can search a node in the graph by its label.
 * There is an autocomplete based on includes & lower case.
 * When a node is found, the graph will focus on the highlighted node
 *
 * ```jsx
 * <SigmaContainer>
 *   <ControlsContainer>
 *     <SearchControl />
 *   </ControlsContainer>
 * </SigmaContainer>
 * ```
 * See [[SearchControlProps]] for more information.
 *
 * @category Component
 */

function getUniqueKey(): string {
  return Math.random().toString(36).slice(2);
}

export const AuthorSearch: React.FC<SearchControlProps> = ({
  id,
  className,
  style,
  labels = {},
  onLocate,
}: SearchControlProps) => {
  // Get sigma
  const sigma = useSigma();
  // Get event hook
  const registerEvents = useRegisterEvents();
  // Get camera hook
  const { goto: cameraGoTo } = useCamera();
  // Search value
  const [search, setSearch] = useState<string>("");
  // Datalist values
  const [values, setValues] = useState<Array<{ id: string; label: string }>>(
    []
  );
  // Selected
  const [selected, setSelected] = useState<string | null>(null);
  // random id for the input
  const [inputId, setInputId] = useState<string>("");

  /**
   * When component mount, we set a random input id.
   */
  useEffect(() => {
    setInputId(`search-${getUniqueKey()}`);
  }, []);

  /**
   * When the search input changes, recompute the autocomplete values.
   */
  useEffect(() => {
    const newValues: Array<{ id: string; label: string }> = [];
    if (!selected && search.length > 1) {
      const authorSet = new Set<string>();
      sigma
        .getGraph()
        .forEachNode((key: string, attributes: Attributes): void => {
          if (
            attributes.author_handle &&
            attributes.author_handle
              .toLowerCase()
              .includes(search.toLowerCase())
          )
            if (!authorSet.has(attributes.author_handle)) {
              authorSet.add(attributes.author_handle);
              newValues.push({ id: key, label: attributes.author_handle });
            }
        });
    }
    setValues(newValues);
  }, [search]);

  /**
   * When use clik on the stage
   *  => reset the selection
   */
  useEffect(() => {
    registerEvents({
      clickStage: () => {
        setSelected(null);
        setSearch("");
      },
    });
  }, [registerEvents]);

  /**
   * When the selected item changes, highlighted the node and center the camera on it.
   */
  useEffect(() => {
    if (!selected) {
      return;
    }

    if (onLocate) {
      onLocate(selected);
    }

    sigma.getGraph().setNodeAttribute(selected, "highlighted", true);

    document.getElementById(inputId)?.blur();

    const nodeDisplayData = sigma.getNodeDisplayData(selected);

    cameraGoTo({
      x: nodeDisplayData.x,
      y: nodeDisplayData.y,
      ratio: 0.1,
    });

    return () => {
      sigma.getGraph().setNodeAttribute(selected, "highlighted", false);
    };
  }, [selected]);

  /**
   * On change event handler for the search input, to set the state.
   */
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const searchString = e.target.value;
    const valueItem = values.find((value) => value.label === searchString);
    if (valueItem) {
      setSearch(valueItem.label);
      setValues([]);
      setSelected(valueItem.id);
    } else {
      setSelected(null);
      setSearch(searchString);
    }
  };

  // Common html props for the div
  const htmlProps = {
    className: `react-sigma-search ${className ? className : ""}`,
    id,
    style,
  };

  return (
    <div {...htmlProps} className="w-full">
      <label htmlFor={inputId} style={{ display: "none" }}>
        {labels["text"] || "Search a node"}
      </label>
      <input
        id={inputId}
        type="text"
        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-3"
        placeholder={labels["placeholder"] || "Search for a Handle"}
        list={`${inputId}-datalist`}
        value={search}
        onChange={onInputChange}
      />
      <datalist id={`${inputId}-datalist`}>
        {values.map((value: { id: string; label: string }) => (
          <option key={value.id} value={value.label}>
            {value.label}
          </option>
        ))}
      </datalist>
    </div>
  );
};
