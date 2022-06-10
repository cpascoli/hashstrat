import { Form, Container, Row, Col, Card } from 'react-bootstrap'
import { round } from '../web3/utils'

import { getInstance } from '../web3/provider'

const StrategyInfoView = ( { name, description, targetInvestPercent, rebalancingThreshold, pricefeedAddress,
   depositTokenBalance, investTokenBalance, depositTokenSymbol, investTokenSymbol, latestFeedPrice, latestFeedTimestamp} ) => {
  
  const networkExplorerHost = getInstance().getInfo().networkExplorerHost
  const investPercText =  targetInvestPercent && <span> {targetInvestPercent} %  / {(100 - targetInvestPercent )}%  </span>
  
  const targetPercUp =  (parseInt(targetInvestPercent) + parseInt(rebalancingThreshold) ) / 100
  const targetPercDown =  (parseInt(targetInvestPercent) - parseInt(rebalancingThreshold) ) / 100

  const rebalancingUpperBandPrice = round( targetPercUp  * depositTokenBalance / (investTokenBalance - targetPercUp  * investTokenBalance))
  const rebalancingLowerBandPrice = round( targetPercDown  * depositTokenBalance / (investTokenBalance - targetPercDown  * investTokenBalance))

  const formattedPriceTimestant = new Date(latestFeedTimestamp * 1000).toLocaleTimeString()
  const formattedPrice = round(latestFeedPrice)



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
              <Form.Label column className="text-start"> Rebalancing Band </Form.Label>
              <Form.Label column className="text-end"> {rebalancingThreshold} % </Form.Label>
            </Form.Group>

            <Form.Group as={Row} controlId="invest-token-address">
              <Form.Label column className="text-start">Rebalancing pool when</Form.Label>
              <Form.Label column className="text-end">
               {investTokenSymbol} above   {rebalancingUpperBandPrice} {depositTokenSymbol} or below  {rebalancingLowerBandPrice} {depositTokenSymbol} 
              </Form.Label>
            </Form.Group>

            <Form.Group as={Row} controlId="invest-token-address">
              <Form.Label column className="text-start"> Current {investTokenSymbol} feed price</Form.Label>
              <Form.Label column className="text-end">
                    {formattedPrice} {depositTokenSymbol} at {formattedPriceTimestant}
              </Form.Label> 
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