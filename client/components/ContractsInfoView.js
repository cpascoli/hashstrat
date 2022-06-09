import { Form, Container, Row, Col, Card } from 'react-bootstrap'

import { getInstance } from '../web3/provider'

const ContractsInfoView = ({ depositTokenSymbol, investTokenSymbol }) => {
  
  const poolAddress = getInstance().getPool().address
  const strategyAddress = getInstance().getStrategy().address

  const depositTokenAddress = getInstance().getUsdc().address
  const investTokenAddress = getInstance().getWeth().address
  const networkExplorerHost = getInstance().getInfo().networkExplorerHost

  return (

    <Card >
   
    <Card.Header as="h5">Contracts Info</Card.Header>
 
     <Card.Body>

        <Container className="border">

            <Form.Group as={Row} controlId="pool-address">
              <Form.Label column className="text-start">Pool Contract</Form.Label>
              <Form.Label column className="text-end">
                 <a href={`https://${networkExplorerHost}/address/${poolAddress}`}> {poolAddress} </a>
              </Form.Label>
            </Form.Group>

            <Form.Group as={Row} controlId="strategy-address">
              <Form.Label column className="text-start">Straategy Contract</Form.Label>
              <Form.Label column className="text-end">
                 <a href={`https://${networkExplorerHost}/address/${strategyAddress}`}> {strategyAddress} </a>
              </Form.Label>
            </Form.Group>

            <Form.Group as={Row} controlId="deposit-token-address">
              <Form.Label column className="text-start">{depositTokenSymbol} Contract</Form.Label>
              <Form.Label column className="text-end">
                 <a href={`https://${networkExplorerHost}/address/${depositTokenAddress}`}> {depositTokenAddress} </a>
              </Form.Label>
            </Form.Group>

            <Form.Group as={Row} controlId="invest-token-address">
              <Form.Label column className="text-start">{investTokenSymbol} Contract</Form.Label>
              <Form.Label column className="text-end">
                 <a href={`https://${networkExplorerHost}/address/${investTokenAddress}`}> {investTokenAddress} </a>
              </Form.Label>
            </Form.Group>

            </Container>
    </Card.Body>
  </Card>


)}


export default ContractsInfoView;