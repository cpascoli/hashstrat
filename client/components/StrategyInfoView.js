import { Form, Container, Row, Col, Card } from 'react-bootstrap'

import { getInstance } from '../web3/provider'

const StrategyInfoView = ( { name, description, targetInvestPercent, rebalancingThreshold, pricefeedAddress } ) => {
  
  const networkExplorerHost = getInstance().getInfo().networkExplorerHost
  const investPercText =  targetInvestPercent && <span> {targetInvestPercent} %  / {(100 - targetInvestPercent )}%  </span>

  return (

    <Card >
   
    <Card.Header as="h5">Strategy Info</Card.Header>
 
     <Card.Body>

        <Container className="border">

            <Form.Group as={Row} controlId="pool-address">
              <Form.Label column className="text-start"> Name</Form.Label>
              <Form.Label column className="text-end">
                  {name}
              </Form.Label>
            </Form.Group>

            <Form.Group as={Row} controlId="strategy-address">
              <Form.Label column className="text-start">Descripton</Form.Label>
              <Form.Label column className="text-end">
                 {description}
              </Form.Label>
            </Form.Group>

            <Form.Group as={Row} controlId="deposit-token-address">
              <Form.Label column className="text-start"> Target Pool Allocation </Form.Label>
              <Form.Label column className="text-end"> {investPercText} </Form.Label>
            </Form.Group>

            <Form.Group as={Row} controlId="deposit-token-address">
              <Form.Label column className="text-start"> Regalancing Thereshold </Form.Label>
              <Form.Label column className="text-end"> {rebalancingThreshold} % </Form.Label>
            </Form.Group>

            <Form.Group as={Row} controlId="invest-token-address">
              <Form.Label column className="text-start">Pricefeed Contract</Form.Label>
              <Form.Label column className="text-end">
                 <a href={`https://${networkExplorerHost}/address/${pricefeedAddress}`}> {pricefeedAddress} </a>
              </Form.Label>
            </Form.Group>

            </Container>
    </Card.Body>
  </Card>


)}


export default StrategyInfoView;