import React from 'react'
import { Form, Button, InputGroup, Container, Card, FormControl, Row, Col } from 'react-bootstrap'

import { Center, Wrapped} from "../components/Layout"

import TitleValueBox from './TitleValueBox'
// import RewardsInfo from './RewardsInfo'

import DepositWithdrawForm from './DepositWithdrawForm'
import Modal from "./Modal"


export default class DepositWithdrawView extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      ...props,
      showUpdateStakeModal: false,
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.balanceUSDC !== this.props.balanceUSDC ||
      prevProps.portfolioValue !== this.props.portfolioValue 
    ) {
      this.setState({
        balanceUSDC: this.props.balanceUSDC,
        portfolioValue: this.props.portfolioValue,
      })
    }
  }



  claimRewardPressed = () => {
    claimReward().then(result => {
      this.props.handleSuccess(`Reward claimed. Transaction id: ${result.tx}`)
    }).catch((error) => {
      this.props.handleError(error)
    })
  }


  showDepositWithdrawModalPreseed = (buttonType) => {
    this.setState({
      showUpdateStakeModal: true,
      formType: buttonType
    })
  }

  hideUpdateStakeModalPreseed = () => {
    this.setState({
      showUpdateStakeModal: false,
      formType: undefined
    })
  }

  handleAllowanceUpdated = () => {
    this.props.allowanceUpdated()
  }

  handleSuccess = (result) => {
    this.hideUpdateStakeModalPreseed()
    this.props.handleSuccess(result)
  }

  handleError = (error, message) => {
    this.hideUpdateStakeModalPreseed()
    this.props.handleError(error, message)
  }


  render() {

    const { showUpdateStakeModal, formType, balanceUSDC, portfolioValue } = this.state

 
    return (
      <div>

        <Wrapped>
            <Card style={{flex: 1, minWidth:200, margin: 10 }}>
              <Card.Title className="p-2">USDC Balance</Card.Title>
              <Card.Body> { balanceUSDC } USDC </Card.Body>
            </Card>
            <Card style={{flex: 1, minWidth:200, margin: 10 }}>
              <Card.Title className="p-2">Portfolio Value</Card.Title>
              <Card.Body> { portfolioValue } USDC </Card.Body>
            </Card>
        </Wrapped>

        <div className="mt-4"></div>
        
        
        <Center maxWidth="500">

          <TitleValueBox title="Available to deposit" value={balanceUSDC} symbol="USDCP" />

          <div className="mt-4"></div>

          <Container>
            <Row>
              <Col>
                <Button name="stake" className="w-100" variant="primary" onClick={(e) => this.showDepositWithdrawModalPreseed("deposit")}>Deposit</Button>
              </Col>
              <Col>
                <Button name="unstake" className="w-100" variant="secondary" onClick={(e) => this.showDepositWithdrawModalPreseed("withdraw")}>Withdraw</Button>
              </Col>
            </Row>
          </Container>

          <div className="mt-4"></div>

          {/* <RewardsInfo rewardRate={rewardRate} totalRewardsPaid={totalRewardsPaid} /> */}

          <div className="mt-4"></div>

          {showUpdateStakeModal && (
            <Modal onClose={(e) => this.hideUpdateStakeModalPreseed()}>
              <DepositWithdrawForm 
                formType={formType}
                handleSuccess={(result) => this.handleSuccess(result)}
                handleError={(error, message) => this.handleError(error, message)}
                allowanceUpdated={() => this.handleAllowanceUpdated()}
                balance={formType == "deposit" ? this.state.balanceUSDC : formType == "withdraw" ? this.state.portfolioValue : 0}
              />
            </Modal>
          )}

        </Center>

      </div>
    )
  }
}