import { Text, Box } from '@chakra-ui/react';

interface MarkdownTextProps {
  content: string | any[] | Record<string, any>;
  [key: string]: any;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ content, ...rest }) => {
  if (!content) return null;

  // Ensure content is a string before splitting
  let contentString = '';
  if (typeof content === 'string') {
    contentString = content;
  } else if (Array.isArray(content)) {
    contentString = (content as any[]).map((item: any) => {
      if (typeof item === 'object' && item !== null) {
        return item.text || item.content || item.reason || item.insights || JSON.stringify(item);
      }
      return String(item);
    }).join('\n');
  } else if (typeof content === 'object' && content !== null) {
    const obj = content as any;
    contentString = obj.text || obj.content || obj.reason || obj.insights || JSON.stringify(content);
  } else {
    contentString = String(content || '');
  }

  const lines = contentString.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <Box as="ul" key={`list-${key}`} ml={6} my={2} style={{ listStyleType: 'disc' }}>
          {currentList.map((item, idx) => (
            <Box as="li" key={idx} fontSize="inherit" color="inherit" mb={1}>
              {renderFormattedText(item)}
            </Box>
          ))}
        </Box>
      );
      currentList = [];
    }
  };

  const renderFormattedText = (text: string) => {
    // Handle bold: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Box as="span" key={index} fontWeight="bold" color="inherit">
            {part.slice(2, -2)}
          </Box>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Handle ### Heading
    if (trimmedLine.startsWith('### ')) {
      flushList(index);
      elements.push(
        <Box key={index} mt={4} mb={2} borderBottom="1px solid" borderColor="inherit" pb={1} opacity={0.8}>
            <Text {...rest} fontWeight="black" fontSize="xs" letterSpacing="widest" textTransform="uppercase">
                {renderFormattedText(trimmedLine.slice(4))}
            </Text>
        </Box>
      );
    }
    // Simple bullet point detection: - Item or * Item
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      currentList.push(trimmedLine.slice(2));
    } else {
      flushList(index);
      if (trimmedLine) {
        elements.push(
          <Text key={index} {...rest} mb={2}>
            {renderFormattedText(line)}
          </Text>
        );
      } else {
        elements.push(<Box key={index} h={1} />); // Spacer for empty lines
      }
    }
  });

  flushList(lines.length);

  return <Box>{elements}</Box>;
};

export default MarkdownText;
