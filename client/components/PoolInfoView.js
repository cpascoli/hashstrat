import { Form, Container, Row, Col } from 'react-bootstrap'

const PoolInfoView = ({ deposits, withdrawals, depositTokenBalance, investTokenBalance, totalPortfolioValue, investedTokenValue, depositTokenSymbol, investTokenSymbol }) => (

  <Container className="border border-primary" >
      <Form.Group as={Row} controlId="deposits">
        <Form.Label column  style={{minWidth:250}} className="text-start">Total Deposits</Form.Label>
        <Col />
        <Form.Label column  style={{minWidth:200}} className="text-end">
          { deposits } { depositTokenSymbol }
        </Form.Label>
      </Form.Group>

      <Form.Group as={Row} controlId="withdrawals">
        <Form.Label column  style={{minWidth:250}} className="text-start">Total Withdrawals</Form.Label>
        <Col />
        <Form.Label column  style={{minWidth:200}} className="text-end">
        { withdrawals } { depositTokenSymbol }
        </Form.Label>
      </Form.Group>

      <Form.Group as={Row} controlId="value">
        <Form.Label column  style={{minWidth:250}} className="text-start">Pool Value</Form.Label>
        <Col />
        <Form.Label column  style={{minWidth:200}} className="text-end">
        { totalPortfolioValue } { depositTokenSymbol }
        </Form.Label>
      </Form.Group>

      <Form.Group as={Row} controlId="tokenSplit">
        <Form.Label column  style={{minWidth:250}} className="text-start">Current Allocation</Form.Label>
        <Col />
        <Form.Label column  style={{minWidth:200}} className="text-end">
            { depositTokenBalance } { depositTokenSymbol } +  { investTokenBalance } { investTokenSymbol }
        </Form.Label>
      </Form.Group>

      <Form.Group as={Row} controlId="allocationPercentace">
        <Form.Label column  style={{minWidth:250}} className="text-start">Pool Weights ({investTokenSymbol} / {depositTokenSymbol})</Form.Label>
        <Col />
        <Form.Label column  style={{minWidth:200}} className="text-end">
            { Math.round(10000 * investedTokenValue / totalPortfolioValue) / 100 }%  {' '} / {' '}
            { Math.round(10000 * depositTokenBalance / totalPortfolioValue) / 100 }%
        </Form.Label>
      </Form.Group>

  </Container>
)

export default PoolInfoView;