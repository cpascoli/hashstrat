
import React from 'react'
import { Alert } from 'react-bootstrap'

import { getBalance as getBalancePoolLP } from "../web3/pool_lp"
import { getBalance as getBalanceUSDC } from "../web3/usdc"
import { getPortfolioValue } from "../web3/pool"

import Header from "../components/Header" 
import { Page, Center } from "../components/Layout"
import { AlertDismissible } from "../components/AlertDismissible"
import DepositWithdrawView from "../components/DepositWithdrawView"


// add bootstrap css 
import 'bootstrap/dist/css/bootstrap.css'


export default class IndexPage extends React.Component {

  constructor(props) {
      super(props)
      this.state = {

      }
      this.headerRef= React.createRef();

      this.handleSuccess = this.handleSuccess.bind(this)
      this.handleError = this.handleError.bind(this)
      this.handleAllowanceUpdated = this.handleAllowanceUpdated.bind(this)
  }

  componentDidMount() {
    this.reload()
  } 


  reload() {
    this.loadBalances()
  }


  stakeUpdated = async () => {
    await this.headerRef.current.reload()
    await this.reload()
  }

  setAccountConnected = (connected) => {
    this.setState({
      accountConnected: connected,
    })
  }
    

  async loadBalances() {

    getBalanceUSDC().then(data => {
      this.setState({
          balanceUSDC: data.units
      })
      return getBalancePoolLP()
    }).then(data => {
        this.setState({
            balancePoolLP: data.units
        })
        return getPortfolioValue()
    }).then(data => {
        this.setState({
            portfolioValue: data.units
        })
    }).catch(error => {
        this.setState({ error: error.message })
    })

  }


  handleAllowanceUpdated = () => {
      console.log(">>> handleAllowanceUpdated() -- TODO")
  }


  handleSuccess = (result) => {
      this.headerRef.current.reload()
      this.reload()
      this.setState({
          info: { 
              title: "Success!", 
              detail: JSON.stringify(result, null, 2),
          }
      })
  }


  handleError = (error, message) => {
      if (message) {
          this.setState({error: message})
      } else if (error && error.message) {
          this.setState({error: error.message})
      } else {
          const msg = JSON.stringify(error, null, 2)
          this.setState({error: `An error occurred (${msg})`})
      }
  }

  render() {

    const { accountConnected, balanceUSDC, portfolioValue, balancePoolLP } =  this.state

    if (!accountConnected) return (
      <Page>
          <Header ref={this.headerRef} reload={() => this.reload()} setAccountConnected={connected => this.setAccountConnected(connected)}/>
          <Center> 
              <Alert variant="info" title="No Ethereum account connected" style={{textAlign: "center"}}> 
                Please connect an Ethereum account to use the dapp!
              </Alert>
          </Center>
      </Page>
    )


    
    return (

        <Page>

             <Header ref={this.headerRef} reload={() => this.reload()} setAccountConnected={connected => this.setAccountConnected(connected)}/>

             <div className="w-100 divisor" > </div>
             <Center > 
                { this.state.error && <AlertDismissible variant="danger" title="Error"> {this.state.error} </AlertDismissible> }
                { this.state.info && <AlertDismissible variant="info" title={this.state.info.title}>{this.state.info.detail}</AlertDismissible> }

                    <div className="w-100 divisor" > </div>

                    <DepositWithdrawView
                      balanceUSDC={balanceUSDC}
                      portfolioValue={portfolioValue}

                      handleSuccess={this.handleSuccess} 
                      handleError={this.handleError}
                      allowanceUpdated={this.handleAllowanceUpdated}
          
                    />

            </Center>

        </Page>
     
    )
  }
}