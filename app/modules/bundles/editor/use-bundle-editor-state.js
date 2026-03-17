import { useEffect, useState } from "react";
import {
  filterAvailableDisabledOptionValueKeys,
  getBundleProducts,
  getCreateProductError,
} from "./helpers.js";

export function useBundleEditorState({ bundle, actionData, shop }) {
  const [selectedProductA, setSelectedProductA] = useState(bundle?.productA ?? null);
  const [selectedProductB, setSelectedProductB] = useState(bundle?.productB ?? null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [combineMatchingOptions, setCombineMatchingOptions] = useState(false);
  const [disabledOptionValueKeys, setDisabledOptionValueKeys] = useState([]);

  useEffect(() => {
    setSelectedProductA(bundle?.productA ?? null);
    setSelectedProductB(bundle?.productB ?? null);
    setIsProductModalOpen(false);
    setDisabledOptionValueKeys([]);
  }, [bundle]);

  useEffect(() => {
    if (!bundle?.id || typeof window === "undefined") {
      setCombineMatchingOptions(false);
      return;
    }

    const savedValue = window.localStorage.getItem(
      `bundle:${bundle.id}:combineMatchingOptions`,
    );

    setCombineMatchingOptions(savedValue === "true");
  }, [bundle?.id]);

  useEffect(() => {
    if (!bundle?.id || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      `bundle:${bundle.id}:combineMatchingOptions`,
      String(combineMatchingOptions),
    );
  }, [bundle?.id, combineMatchingOptions]);

  useEffect(() => {
    if (!bundle?.id || typeof window === "undefined") {
      setDisabledOptionValueKeys([]);
      return;
    }

    try {
      const savedValue = window.localStorage.getItem(
        `bundle:${bundle.id}:disabledOptionValueKeys`,
      );
      const parsedValue = savedValue ? JSON.parse(savedValue) : [];

      setDisabledOptionValueKeys(
        Array.isArray(parsedValue)
          ? parsedValue.filter((value) => typeof value === "string")
          : [],
      );
    } catch {
      setDisabledOptionValueKeys([]);
    }
  }, [bundle?.id]);

  useEffect(() => {
    if (!bundle?.id || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      `bundle:${bundle.id}:disabledOptionValueKeys`,
      JSON.stringify(disabledOptionValueKeys),
    );
  }, [bundle?.id, disabledOptionValueKeys]);

  useEffect(() => {
    if (!bundle?.id) {
      return;
    }

    setDisabledOptionValueKeys((currentKeys) => {
      const nextKeys = filterAvailableDisabledOptionValueKeys(
        getBundleProducts(selectedProductA, selectedProductB),
        shop,
        currentKeys,
      );

      return nextKeys.length === currentKeys.length ? currentKeys : nextKeys;
    });
  }, [bundle?.id, selectedProductA, selectedProductB, shop]);

  useEffect(() => {
    if (getCreateProductError(actionData)) {
      setIsProductModalOpen(true);
    }
  }, [actionData]);

  return {
    selectedProductA,
    selectedProductB,
    setSelectedProductA,
    setSelectedProductB,
    isProductModalOpen,
    setIsProductModalOpen,
    combineMatchingOptions,
    setCombineMatchingOptions,
    disabledOptionValueKeys,
    setDisabledOptionValueKeys,
  };
}
