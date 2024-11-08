// Format field name to Title Case
export const formatFieldLabel = (fieldName: string): string => {
  const parts = fieldName.split('.');
  const displayName = parts[parts.length - 1];
  const words = displayName.split(/[_\s]+/);
  
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Safely access nested object properties
export const getFieldValue = (obj: any, fieldName: string): any => {
  console.log('getFieldValue: Starting field access', { fieldName, obj });
  
  // First check if the field exists directly on the object
  if (fieldName in obj) {
    const value = obj[fieldName];
    console.log('getFieldValue: Direct field access result', { fieldName, value });
    
    // Handle Looker's value object structure
    if (value && typeof value === 'object' && 'value' in value) {
      console.log('getFieldValue: Found Looker value object', value);
      return value.value;
    }
    
    return value;
  }
  
  // If not found directly, try nested access
  const parts = fieldName.split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value === null || value === undefined || typeof value !== 'object') {
      console.log('getFieldValue: Nested access failed at part', { part, currentValue: value });
      return undefined;
    }
    
    value = value[part];
    
    // Handle Looker's value object structure at each level
    if (value && typeof value === 'object' && 'value' in value) {
      console.log('getFieldValue: Found nested Looker value object', value);
      value = value.value;
    }
  }
  
  console.log('getFieldValue: Final nested access result', { fieldName, value });
  return value;
};

// Get title classes based on settings
export const getTitleClasses = (titleAlignment: string, titlePadding: string) => {
  const classes = ['transition-all duration-200'];

  const alignmentClasses: Record<string, string> = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right'
  };
  classes.push(alignmentClasses[titleAlignment]);

  const paddingClasses: Record<string, string> = {
    'compact': 'py-2',
    'normal': 'py-3',
    'relaxed': 'py-4'
  };
  classes.push(paddingClasses[titlePadding]);

  return classes.join(' ');
};

// Transform Looker data
export const transformLookerData = (data: any[]): any[] => {
  console.log('transformLookerData: Starting data transformation', {
    inputLength: data.length,
    sampleInput: data[0]
  });

  const transformedData = data.map((row: any, index: number) => {
    console.log(`transformLookerData: Processing row ${index}`, row);
    const transformedRow: any = {};
    
    Object.entries(row).forEach(([key, value]) => {
      try {
        if (value === null || value === undefined) {
          transformedRow[key] = null;
        } else if (typeof value === 'object' && 'value' in value) {
          // For Looker's value objects, preserve the value property
          transformedRow[key] = value.value;
          console.log(`transformLookerData: Transformed field ${key}`, {
            original: value,
            transformed: transformedRow[key]
          });
        } else {
          transformedRow[key] = value;
        }
      } catch (error) {
        console.warn(`Error processing field ${key} in row ${index}:`, error);
        transformedRow[key] = null;
      }
    });

    if (index === 0) {
      console.log('transformLookerData: First row transformation', {
        original: row,
        transformed: transformedRow
      });
    }
    
    return transformedRow;
  });

  console.log('transformLookerData: Completed transformation', {
    outputLength: transformedData.length,
    sampleOutput: transformedData[0],
    allData: transformedData
  });
  
  return transformedData;
};
