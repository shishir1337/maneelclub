"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getAttributesForProductForm } from "@/actions/admin/attributes";

interface AttributeValue {
  id: string;
  value: string;
  displayValue: string;
  metadata: { hex?: string } | null;
  sortOrder: number;
}

interface Attribute {
  id: string;
  name: string;
  slug: string;
  values: AttributeValue[];
}

interface SelectedAttribute {
  attributeId: string;
  attributeName: string;
  attributeSlug: string;
  values: {
    id: string;
    value: string;
    displayValue: string;
    metadata?: { hex?: string } | null;
  }[];
}

interface AttributeSelectorProps {
  selectedAttributes: SelectedAttribute[];
  onAttributesChange: (attributes: SelectedAttribute[]) => void;
}

export function AttributeSelector({
  selectedAttributes,
  onAttributesChange,
}: AttributeSelectorProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttributes() {
      const result = await getAttributesForProductForm();
      if (result.success && result.data) {
        setAttributes(result.data as Attribute[]);
      }
      setLoading(false);
    }
    loadAttributes();
  }, []);

  function toggleAttribute(attribute: Attribute) {
    const isSelected = selectedAttributes.some(
      (a) => a.attributeId === attribute.id
    );

    if (isSelected) {
      // Remove attribute
      onAttributesChange(
        selectedAttributes.filter((a) => a.attributeId !== attribute.id)
      );
    } else {
      // Add attribute with no values selected
      onAttributesChange([
        ...selectedAttributes,
        {
          attributeId: attribute.id,
          attributeName: attribute.name,
          attributeSlug: attribute.slug,
          values: [],
        },
      ]);
    }
  }

  function toggleAttributeValue(
    attribute: Attribute,
    value: AttributeValue
  ) {
    const selectedAttr = selectedAttributes.find(
      (a) => a.attributeId === attribute.id
    );

    if (!selectedAttr) {
      // Attribute not selected, add it with this value
      onAttributesChange([
        ...selectedAttributes,
        {
          attributeId: attribute.id,
          attributeName: attribute.name,
          attributeSlug: attribute.slug,
          values: [
            {
              id: value.id,
              value: value.value,
              displayValue: value.displayValue,
              metadata: value.metadata,
            },
          ],
        },
      ]);
      return;
    }

    const isValueSelected = selectedAttr.values.some((v) => v.id === value.id);

    if (isValueSelected) {
      // Remove value
      const updatedValues = selectedAttr.values.filter((v) => v.id !== value.id);
      
      if (updatedValues.length === 0) {
        // Remove attribute if no values left
        onAttributesChange(
          selectedAttributes.filter((a) => a.attributeId !== attribute.id)
        );
      } else {
        onAttributesChange(
          selectedAttributes.map((a) =>
            a.attributeId === attribute.id
              ? { ...a, values: updatedValues }
              : a
          )
        );
      }
    } else {
      // Add value
      onAttributesChange(
        selectedAttributes.map((a) =>
          a.attributeId === attribute.id
            ? {
                ...a,
                values: [
                  ...a.values,
                  {
                    id: value.id,
                    value: value.value,
                    displayValue: value.displayValue,
                    metadata: value.metadata,
                  },
                ],
              }
            : a
        )
      );
    }
  }

  function isAttributeSelected(attributeId: string) {
    return selectedAttributes.some((a) => a.attributeId === attributeId);
  }

  function isValueSelected(attributeId: string, valueId: string) {
    const attr = selectedAttributes.find((a) => a.attributeId === attributeId);
    return attr?.values.some((v) => v.id === valueId) ?? false;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (attributes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No attributes available.</p>
        <p className="text-sm">Create attributes in Settings first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attributes.map((attribute) => {
        const isSelected = isAttributeSelected(attribute.id);
        const selectedAttr = selectedAttributes.find(
          (a) => a.attributeId === attribute.id
        );

        return (
          <Card key={attribute.id} className={isSelected ? "border-primary" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`attr-${attribute.id}`}
                  checked={isSelected}
                  onCheckedChange={() => toggleAttribute(attribute)}
                />
                <Label
                  htmlFor={`attr-${attribute.id}`}
                  className="text-base font-semibold cursor-pointer"
                >
                  {attribute.name}
                </Label>
                {selectedAttr && selectedAttr.values.length > 0 && (
                  <Badge variant="secondary">
                    {selectedAttr.values.length} selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            {isSelected && attribute.values.length > 0 && (
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {attribute.values.map((value) => {
                    const isValueSel = isValueSelected(attribute.id, value.id);
                    const isColor = attribute.slug === "color";

                    return (
                      <Badge
                        key={value.id}
                        variant={isValueSel ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => toggleAttributeValue(attribute, value)}
                      >
                        {isColor && value.metadata?.hex && (
                          <span
                            className="w-3 h-3 rounded-full mr-1.5 border"
                            style={{ backgroundColor: value.metadata.hex }}
                          />
                        )}
                        {value.displayValue}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
