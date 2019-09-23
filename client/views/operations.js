import React, { Component } from "react";
import ReactDOM from 'react-dom';
import ReactTable from "react-table";

import "react-table/react-table.css";


export class OperationsView extends Component {

  constructor(props) {
        super(props);

        this.state = {
          data: [{
                name: 'Tanner Linsley',
                age: 26}],
          loaded: false,
          placeholder: "Loading..."
        };
    }

    update() {
//        fetch(this.props.endpoint).then(response => {
//          if (response.status !== 200) {
//            return this.setState({ placeholder: "Something went wrong", loaded: false });
//          }
//          alert(response.json());  // DEBUG!!!
//          return response.json();
//        }).then(data => {
//          this.setState({ data: data, loaded: true});
//        })
        this.setState({ data:  [{name: 'Tanner Linsley',
                                age: 26}], loaded: true});
  }

  componentDidMount() {
    this.update();
  }

  render_table() {
    const { data, loaded, placeholder } = this.state;
    return (<div>
      <h1>Operations</h1>
        <ReactTable
          data={data}
          columns={[{Header: "Name"}]} />

       </div>)
  }

  render() {
    const { data, loaded, placeholder } = this.state;
    if(loaded){
      return this.render_table();
    }
    return (<b>{placeholder}</b>);
  }
}

/**
 * Operations
 */
export let operationsView = function(){
    ReactDOM.render(
        <OperationsView endpoint="/api/operations/"/>,
        document.getElementById('operations_app')
    );
}