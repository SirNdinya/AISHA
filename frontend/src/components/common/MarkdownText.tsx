import { Text, Box } from '@chakra-ui/react';

interface MarkdownTextProps {
  content: string;
  [key: string]: any;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ content, ...rest }) => {
  if (!content) return null;

  // Split by line breaks and process
  const lines = content.split('\n');
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
    
    // Simple bullet point detection: - Item or * Item
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
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
