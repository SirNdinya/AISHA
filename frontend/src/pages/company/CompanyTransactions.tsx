import React, { useEffect, useState } from 'react';
import {
    Box, Heading, Text, VStack, Card, Badge,
    Flex, Spinner, Table, Icon, HStack
} from '@chakra-ui/react';
import { LuCreditCard, LuUser, LuReceipt, LuCalendar } from 'react-icons/lu';
import apiClient from '../../services/apiClient';

const CompanyTransactions: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await apiClient.get('/payments/company-transactions');
                setTransactions(res.data.data);
            } catch (error) {
                console.error('Failed to fetch transactions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    if (isLoading) {
        return (
            <Flex h="100vh" align="center" justify="center" bg="var(--terminal-bg)">
                <Spinner size="xl" color="var(--terminal-accent)" />
            </Flex>
        );
    }

    return (
        <Box animation="fadeIn 0.5s ease-out" p={8}>
            <Flex justify="space-between" align="center" mb={10}>
                <Box>
                    <Heading size="3xl" fontWeight="black" letterSpacing="tight" color="#F8FAFC">
                        Transaction Ledger
                    </Heading>
                    <Text color="var(--terminal-accent)" fontSize="lg" mt={2}>
                        Track fee payments and stipend disbursements.
                    </Text>
                </Box>
                <Icon as={LuCreditCard} boxSize={12} color="var(--terminal-accent)" opacity={0.2} />
            </Flex>

            {transactions.length === 0 ? (
                <Card.Root bg="var(--terminal-card)" borderColor="var(--terminal-border)" p={10} textAlign="center">
                    <Text color="whiteAlpha.600">No transactions recorded yet.</Text>
                </Card.Root>
            ) : (
                <Card.Root bg="var(--terminal-card)" borderColor="var(--terminal-border)" overflow="hidden" borderRadius="2xl">
                    <Table.Root variant="native">
                        <Table.Header bg="whiteAlpha.50">
                            <Table.Row>
                                <Table.ColumnHeader color="whiteAlpha.600" fontSize="xs">STUDENT</Table.ColumnHeader>
                                <Table.ColumnHeader color="whiteAlpha.600" fontSize="xs">OPPORTUNITY</Table.ColumnHeader>
                                <Table.ColumnHeader color="whiteAlpha.600" fontSize="xs">AMOUNT</Table.ColumnHeader>
                                <Table.ColumnHeader color="whiteAlpha.600" fontSize="xs">RECEIPT CODE</Table.ColumnHeader>
                                <Table.ColumnHeader color="whiteAlpha.600" fontSize="xs">STATUS</Table.ColumnHeader>
                                <Table.ColumnHeader color="whiteAlpha.600" fontSize="xs" textAlign="right">DATE</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {transactions.map((tx) => (
                                <Table.Row key={tx.id} _hover={{ bg: "whiteAlpha.50" }} transition="0.2s">
                                    <Table.Cell>
                                        <HStack>
                                            <Icon as={LuUser} color="var(--terminal-accent)" />
                                            <Text fontWeight="bold" color="whiteAlpha.900">
                                                {tx.first_name} {tx.last_name}
                                            </Text>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell color="whiteAlpha.700">{tx.opportunity_title}</Table.Cell>
                                    <Table.Cell>
                                        <Text fontWeight="black" color="green.400">
                                            KES {parseFloat(tx.amount).toLocaleString()}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <HStack>
                                            <Icon as={LuReceipt} color="blue.400" />
                                            <Text fontFamily="mono" fontSize="sm" color="whiteAlpha.800">
                                                {tx.mpesa_receipt_number || 'N/A'}
                                            </Text>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge 
                                            colorPalette={tx.status === 'COMPLETED' ? 'green' : tx.status === 'FAILED' ? 'red' : 'orange'}
                                            variant="subtle"
                                        >
                                            {tx.status}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell textAlign="right" color="whiteAlpha.500" fontSize="xs">
                                        <HStack justify="flex-end">
                                            <Icon as={LuCalendar} />
                                            <Text>{new Date(tx.transaction_date).toLocaleDateString()}</Text>
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Card.Root>
            )}
        </Box>
    );
};

export default CompanyTransactions;
